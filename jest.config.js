module.exports = {
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json",
        },
    },
    moduleFileExtensions: [
        "ts",
        "js",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": ["@swc/jest"],
    },
    testMatch: [
        "**/test/**/*.spec.ts",
    ],
    testEnvironment: "node",
};
