'use strict';

module.exports = {
	rules: {
		'multiline-braces': {
			meta: {
				type: 'layout',
				docs: {
					description: 'Require multiline braces if more than N properties/elements',
					recommended: false,
				},
				fixable: 'code',
				schema: [
					{
						type: 'object',
						properties: {
							maxProperties: { type: 'number' },
						},
						additionalProperties: false,
					},
				],
			},

			create: function(context) {
				var sourceCode = context.getSourceCode();
				var maxProperties = (context.options[0] && context.options[0].maxProperties) || 2;

				function checkNode(node, elements, openBrace, closeBrace) {
					if (!openBrace || !closeBrace) return;
					if (elements.length <= maxProperties) return;

					// Проверяем открывающую скобку на отдельной строке
					if (openBrace.loc.start.line === elements[0].loc.start.line) {
						context.report({
							node: node,
							message: 'Opening brace should be on a separate line when more than ' + maxProperties + ' items.',
							fix: function(fixer) {
								var indent = '  ';
								var items = elements.map(function(e) {
									var text = sourceCode.getText(e).trim();
									// убираем любую финальную запятую или точку с запятой
									text = text.replace(/[;,]$/, '');
									return text;
								}).join(',\n' + indent);

								var fixed = '{\n' + indent + items + ',\n}';
								return fixer.replaceTextRange([openBrace.range[0], closeBrace.range[1]], fixed);
							},
						});
						return;
					}

					// Проверяем, что каждое свойство на отдельной строке
					var lastLine = null;
					for (var i = 0; i < elements.length; i++) {
						var el = elements[i];
						if (lastLine === el.loc.start.line) {
							context.report({
								node: node,
								message: 'Each property should be on its own line when more than ' + maxProperties + ' items.',
								fix: function(fixer) {
									var indent = '  ';
									var items = elements.map(function(e) {
										var text = sourceCode.getText(e).trim();
										text = text.replace(/[;,]$/, '');
										return text;
									}).join(',\n' + indent);

									var fixed = '{\n' + indent + items + ',\n}';
									return fixer.replaceTextRange([openBrace.range[0], closeBrace.range[1]], fixed);
								},
							});
							return;
						}
						lastLine = el.loc.start.line;
					}
				}

				return {
					ObjectExpression: function(node) {
						if (!node.properties.length) return;
						var openBrace = sourceCode.getFirstToken(node, function(t){ return t.value === '{'; });
						var closeBrace = sourceCode.getLastToken(node, function(t){ return t.value === '}'; });
						checkNode(node, node.properties, openBrace, closeBrace);
					},

					ObjectPattern: function(node) {
						if (!node.properties.length) return;
						var openBrace = sourceCode.getFirstToken(node, function(t){ return t.value === '{'; });
						var closeBrace = sourceCode.getLastToken(node, function(t){ return t.value === '}'; });
						checkNode(node, node.properties, openBrace, closeBrace);
					},

					ImportDeclaration: function(node) {
						var specs = node.specifiers.filter(function(s){ return s.type === 'ImportSpecifier'; });
						if (!specs.length) return;
						var openBrace = sourceCode.getFirstToken(node, function(t){ return t.value === '{'; });
						var closeBrace = sourceCode.getLastToken(node, function(t){ return t.value === '}'; });
						checkNode(node, specs, openBrace, closeBrace);
					},

					ExportNamedDeclaration: function(node) {
						var specs = node.specifiers.filter(function(s){ return s.type === 'ExportSpecifier'; });
						if (!specs.length) return;
						var openBrace = sourceCode.getFirstToken(node, function(t){ return t.value === '{'; });
						var closeBrace = sourceCode.getLastToken(node, function(t){ return t.value === '}'; });
						checkNode(node, specs, openBrace, closeBrace);
					},

					TSTypeLiteral: function(node) {
						if (!node.members || node.members.length <= maxProperties) return;
						var openBrace = sourceCode.getFirstToken(node, function(t){ return t.value === '{'; });
						var closeBrace = sourceCode.getLastToken(node, function(t){ return t.value === '}'; });
						if (!openBrace || !closeBrace) return;
						checkNode(node, node.members, openBrace, closeBrace);
					},
				};
			},
		},
	},
}

	;
