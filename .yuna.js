module.exports = {
  snyk: {
    config: {
      // Define paths to scan for each language/ecosystem
      codePaths: [
        {
          // Main TypeScript source code
          path: ".",
          language: "typescript",
          ecosystem: "npm",
          manifest: "package.json",
          testCommand: "snyk test --json --all-projects --detection-depth=3 --file=package.json"
        },
      ],
      // Global Snyk settings
      settings: {
        detectionDepth: 3,
        allProjects: true,
        failOn: "high", // fail on high or critical vulnerabilities
        ignoreDevDeps: false, // check dev dependencies too
        ignoreUnresolved: false // don't ignore unresolved dependencies
      }
    }
  }
}; 
