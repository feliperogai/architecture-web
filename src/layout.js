// Uma única condição para o layout "empilhado" (celular e tablet em pé):
// a ficha do projeto fica embaixo da tela e a câmera mira o centro do prédio.
// O CSS (src/styles/main.css) usa exatamente STACKED_LAYOUT_QUERY; um teste garante isso.

export const STACKED_LAYOUT_QUERY = '(max-width: 720px), (max-aspect-ratio: 17/20)';

export function isStackedLayout(width, height) {
  return width <= 720 || width / height <= 17 / 20;
}
