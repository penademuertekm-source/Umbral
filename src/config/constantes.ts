/** Archivo de Figma del proyecto. En la URL, el nodo usa guion: 3:2 → 3-2. */
export const FIGMA_FILE_URL = 'https://www.figma.com/design/AYqMU7Zqwegk1SGgZFJqTX/'

export function figmaNodeUrl(node: string): string {
  return `${FIGMA_FILE_URL}?node-id=${node.replace(':', '-')}`
}
