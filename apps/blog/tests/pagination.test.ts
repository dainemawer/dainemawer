import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countPages,
  laterPages,
  pagePath,
  pageRange,
  paginate,
  parsePageParam,
} from "@/lib/pagination";

const items = Array.from({ length: 25 }, (_, index) => index + 1);

describe("parsePageParam", () => {
  it("accepts positive integers", () => {
    assert.equal(parsePageParam("1"), 1);
    assert.equal(parsePageParam("12"), 12);
  });

  it("rejects anything that would be a duplicate or invalid URL", () => {
    for (const value of ["0", "02", "2.0", "+2", "-1", "abc", "", " 2"]) {
      assert.equal(parsePageParam(value), undefined, value);
    }
  });
});

describe("paginate", () => {
  it("slices ten per page by default", () => {
    const slice = paginate(items, 2);
    assert.deepEqual(slice?.items, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    assert.equal(slice?.offset, 10);
    assert.equal(slice?.totalPages, 3);
  });

  it("returns a short last page", () => {
    assert.deepEqual(paginate(items, 3)?.items, [21, 22, 23, 24, 25]);
  });

  it("returns undefined past the last page and below page 1", () => {
    assert.equal(paginate(items, 4), undefined);
    assert.equal(paginate(items, 0), undefined);
    assert.equal(paginate(items, 1.5), undefined);
  });

  it("always has a page 1, even when empty", () => {
    assert.deepEqual(paginate([], 1), {
      items: [],
      page: 1,
      totalPages: 1,
      offset: 0,
    });
  });
});

describe("countPages and laterPages", () => {
  it("counts partial pages", () => {
    assert.equal(countPages(0), 1);
    assert.equal(countPages(10), 1);
    assert.equal(countPages(11), 2);
  });

  it("lists pages 2…N only", () => {
    assert.deepEqual(laterPages(10), []);
    assert.deepEqual(laterPages(25), [2, 3]);
  });
});

describe("pagePath", () => {
  it("keeps page 1 at the listing's own URL", () => {
    assert.equal(pagePath("/", 1), "/");
    assert.equal(pagePath("/topics/css", 1), "/topics/css");
  });

  it("nests later pages under /page/N", () => {
    assert.equal(pagePath("/", 2), "/page/2");
    assert.equal(pagePath("/topics/css", 3), "/topics/css/page/3");
  });
});

describe("pageRange", () => {
  it("lists every page when there are few", () => {
    assert.deepEqual(pageRange(1, 3), [1, 2, 3]);
    assert.deepEqual(pageRange(3, 5), [1, 2, 3, 4, 5]);
  });

  it("collapses skipped runs into one gap per side", () => {
    assert.deepEqual(pageRange(5, 12), [
      1,
      "gap-start",
      4,
      5,
      6,
      "gap-end",
      12,
    ]);
    assert.deepEqual(pageRange(1, 12), [1, 2, "gap-end", 12]);
    assert.deepEqual(pageRange(12, 12), [1, "gap-start", 11, 12]);
  });

  it("shows a single skipped page rather than an ellipsis for it", () => {
    assert.deepEqual(pageRange(4, 12), [1, 2, 3, 4, 5, "gap-end", 12]);
  });
});
