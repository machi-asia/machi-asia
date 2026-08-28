export default {
  testEnvironment: "node",
  transformIgnorePatterns: ["node_modules/(?!jose)"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2020",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          resolveJsonModule: true,
          jsx: "react-jsx",
        },
      },
    ],
    "^.+\\.jsx?$": [
      "ts-jest",
      {
        tsconfig: {
          allowJs: true,
          target: "ES2020",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
        },
      },
    ],
  },
};