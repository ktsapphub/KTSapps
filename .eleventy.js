module.exports = function (eleventyConfig) {
  // CSS, JS and everything the CMS uploads are copied through untouched.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "public": "." });

  // Rebuild the browser when CSS/JS change during `npm run dev`.
  eleventyConfig.setServerOptions({ watch: ["_site/assets/**/*"] });

  // rgb triplet helper -> lets the CMS store a normal hex colour (#ff6eb4)
  // while the CSS keeps using rgba(var(--tint), .2) for tinting.
  eleventyConfig.addFilter("rgbTriplet", (hex) => {
    if (!hex) return "79,216,255";
    const h = String(hex).replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    if (Number.isNaN(n) || full.length !== 6) return "79,216,255";
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  });

  // "Bloom View" -> "bloom-view", used for asset filenames and anchor ids.
  eleventyConfig.addFilter("slugify", (str) =>
    String(str || "").toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );

  // Monogram fallback when a project has no cover image.
  // "Bloom View" -> BV. "IG Scout" -> IG, because a name that already
  // opens with an acronym should keep it rather than become "IS".
  eleventyConfig.addFilter("monogram", (str) => {
    const words = String(str || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";
    const first = words[0];
    if (first.length >= 2 && first === first.toUpperCase() && /[A-Z]/.test(first)) {
      return first.slice(0, 2);
    }
    return words.map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
