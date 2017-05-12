module.exports = {
    "extends": "airbnb",
    "plugins": [
      "react",
      "jsx-a11y",
      "import"
    ],
    "rules": {
      "max-len": [1, 120, { "tabWidth": 2, "ignoreComments": true }],
      "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
      "react/require-default-props": [0],
      "react/no-unused-prop-types": [2, {
          "skipShapeProps": true
      }],
      "react/no-multi-comp": [0],
      "no-bitwise": [0],
    },
    "env": {
      "browser": true,
      "jest": true
    },
};
