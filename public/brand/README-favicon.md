# favicon.ico — instruções de geração

O arquivo `favicon.ico` (raster 32x32 para compatibilidade com browsers antigos) não é gerado automaticamente. Use uma das opções abaixo a partir do `favicon.svg` desta pasta.

## Opção 1 — ferramenta web

1. Acesse https://realfavicongenerator.net/
2. Envie o arquivo `public/brand/favicon.svg`
3. Baixe o pacote gerado e extraia apenas o `favicon.ico` para `public/brand/favicon.ico`

## Opção 2 — ImageMagick local

```bash
# a partir da raiz do repo
magick public/brand/favicon.svg -resize 32x32 public/brand/favicon.ico
```

Em versões mais antigas do ImageMagick use `convert` no lugar de `magick`.

## Validação

Após gerar o `.ico`, abra `http://localhost:3000/brand/favicon.ico` em `npm run dev` para confirmar que o arquivo é servido. O `layout.tsx` já referencia esse caminho no bloco `icons` do metadata.
