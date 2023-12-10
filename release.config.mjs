/**
 * @type {import('semantic-release').GlobalConfig}
 */

export default {
  branches: [
    "+([0-9])?(.{+([0-9]),x}).x",
    "main",
    "next",
    "next-major",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/github",
    [
      "@semantic-release/npm",
      {
        pkgRoot: "dist",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "README.md"],
        message:
          "chore(release): ${nextRelease.version} 🚀\n\n${nextRelease.notes}",
      },
    ],
  ],
};
