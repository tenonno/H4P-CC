# Code Connection for Minecraft += Feeles

for Windows and macOS

![](https://feeles.blob.core.windows.net/dev/msedu/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202017-06-06%2010.16.42.png)

![](https://feeles.blob.core.windows.net/dev/msedu/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202017-06-06%2010.16.53.png)

![](https://feeles.blob.core.windows.net/dev/msedu/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202017-06-06%2010.18.25.png)

# インストール

## Windows

1. `npm install -g asar`  
https://github.com/electron/asar
1. `git clone https://github.com/tenonno/H4P-CC.git app`
1. `asar pack app app.asar`
1. `app.asar` を **上書き**

## macOS

1. `cd /Applications/Code\ Connection\ for\ Minecraft.app/Contents/Resources`
1. `mv app app.backup`  
(`app` ディレクトリのバックアップをとる)
1. `git clone https://github.com/tenonno/H4P-CC.git app`

# やること

- [x] macOS での Copy and Paste キーバインド
- [ ] ビルド済みの `app.asar` を Release で配布
