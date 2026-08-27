const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { expect, test } = require('@jest/globals');
const ts = require('typescript');

function tsxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? tsxFiles(path) : entry.name.endsWith('.tsx') ? [path] : [];
  });
}

test('Link asChild children do not receive array-valued styles', () => {
  const violations = [];

  for (const file of tsxFiles(join(process.cwd(), 'app')).concat(tsxFiles(join(process.cwd(), 'src')))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    function visit(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'Link') {
        const asChild = node.openingElement.attributes.properties.some(
          (attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'asChild',
        );
        const child = node.children.find(ts.isJsxElement);
        const style = child?.openingElement.attributes.properties.find(
          (attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'style',
        );
        const expression = style && ts.isJsxAttribute(style) && style.initializer && ts.isJsxExpression(style.initializer)
          ? style.initializer.expression
          : undefined;

        if (asChild && expression && ts.isArrayLiteralExpression(expression)) {
          const position = source.getLineAndCharacterOfPosition(expression.getStart(source));
          violations.push(`${file}:${position.line + 1}`);
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(source);
  }

  expect(violations).toEqual([]);
});
