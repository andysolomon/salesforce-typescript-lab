import { createElement } from "@lwc/engine-dom";
import ReadingList from "c/readingList";
import getBooks from "@salesforce/apex/ReadingListController.getBooks";
import updateReadingStatus from "@salesforce/apex/ReadingListController.updateReadingStatus";

jest.mock(
  "@salesforce/apex/ReadingListController.getBooks",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/ReadingListController.updateReadingStatus",
  () => ({
    default: jest.fn()
  }),
  { virtual: true }
);

const LANTERN = {
  bookId: "book-lantern",
  title: "The Lantern on Pell Street",
  authorName: "Mara Quinn",
  status: "Reading",
  pagesRead: 80,
  pageCount: 240
};

const RAIN = {
  bookId: "book-rain",
  title: "Field Guide to Indoor Rain",
  authorName: "Samir Adeyemi",
  status: "Reading",
  pagesRead: 40,
  pageCount: null
};

function flushPromises() {
  return Promise.resolve().then(() => Promise.resolve());
}

async function mount(heading) {
  const element = createElement("c-reading-list", {
    is: ReadingList
  });
  if (heading) {
    element.heading = heading;
  }
  document.body.appendChild(element);
  await flushPromises();
  return element;
}

describe("c-reading-list", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders books, progress, and an empty state", async () => {
    getBooks.mockResolvedValue([LANTERN, RAIN]);
    const element = await mount("Shelf by the window");

    expect(element.shadowRoot.querySelector("h1").textContent).toBe(
      "Shelf by the window"
    );
    expect(element.shadowRoot.textContent).toContain(
      "The Lantern on Pell Street"
    );
    expect(element.shadowRoot.textContent).toContain("Mara Quinn");
    expect(element.shadowRoot.textContent).toContain("80 of 240 pages (33%)");
    expect(element.shadowRoot.textContent).toContain("40 pages read");
    expect(
      element.shadowRoot.querySelector('[data-book-status="book-lantern"]')
        .textContent
    ).toBe("Reading");
    expect(
      element.shadowRoot.querySelector(
        'button[data-book-id="book-lantern"][data-status="Reading"]'
      ).ariaPressed
    ).toBe("true");

    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    getBooks.mockResolvedValue([]);
    const empty = await mount();
    expect(empty.shadowRoot.textContent).toContain(
      "No books on this reading list yet."
    );
  });

  it("shows a loading message until the sample list resolves", async () => {
    let resolveBooks;
    getBooks.mockReturnValue(
      new Promise((resolve) => {
        resolveBooks = resolve;
      })
    );
    const element = createElement("c-reading-list", { is: ReadingList });
    document.body.appendChild(element);

    expect(element.shadowRoot.textContent).toContain(
      "Loading the reading list."
    );
    resolveBooks([LANTERN]);
    await flushPromises();
    expect(element.shadowRoot.textContent).toContain(
      "The Lantern on Pell Street"
    );
  });

  it("updates a book status from the Apex response", async () => {
    getBooks.mockResolvedValue([LANTERN]);
    updateReadingStatus.mockResolvedValue({
      ...LANTERN,
      status: "Finished",
      pagesRead: 240
    });
    const element = await mount();
    const finished = element.shadowRoot.querySelector(
      'button[data-book-id="book-lantern"][data-status="Finished"]'
    );

    finished.click();
    await flushPromises();

    expect(updateReadingStatus).toHaveBeenCalledWith({
      bookId: "book-lantern",
      status: "Finished"
    });
    expect(
      element.shadowRoot.querySelector('[data-book-status="book-lantern"]')
        .textContent
    ).toBe("Finished");
    expect(element.shadowRoot.textContent).toContain("240 of 240 pages (100%)");
  });

  it("reports a response that does not match the book contract", async () => {
    getBooks.mockResolvedValue([{ title: "Missing the rest of the fields" }]);
    const element = await mount();

    const alert = element.shadowRoot.querySelector('[role="alert"]');
    expect(alert.textContent).toBe("Book 1 did not match the expected shape.");
    expect(element.shadowRoot.textContent).not.toContain(
      "No books on this reading list yet."
    );
  });

  it("reports an Apex update error and keeps the current status", async () => {
    getBooks.mockResolvedValue([LANTERN]);
    updateReadingStatus.mockRejectedValue({
      body: { message: "Choose Not started, Reading, or Finished." }
    });
    const element = await mount();
    element.shadowRoot
      .querySelector(
        'button[data-book-id="book-lantern"][data-status="Finished"]'
      )
      .click();
    await flushPromises();

    expect(element.shadowRoot.querySelector('[role="alert"]').textContent).toBe(
      "Choose Not started, Reading, or Finished."
    );
    expect(
      element.shadowRoot.querySelector('[data-book-status="book-lantern"]')
        .textContent
    ).toBe("Reading");
  });
});
