# 自分の矢印を変える 3つの問い — PHASE 3A

## 境界と実装

対象は Mykey8376/action-switch-site。基準SHAは
`2b8bcdd4da5293dd7834222b0afad03abd1628e4`。
既存の index.html / assets/styles.css / js/app.js / js/config.js /
js/diagnosis-data.js / js/diagnosis.js は変更禁止。
新ページは既存CSS・JSを読み込まない。新しいバックエンド、解析、外部フォントなし。

START → Q1（4択必須）→ Q2（任意160文字）→ Q3（相手1〜40文字、
行動1〜120文字、今日/明日/今週）→ RESULT。
文字数はUnicodeコードポイント数。Q3は前後空白除去後に長さを検証する。
Q2は内省専用で、結果・コピー・URL・通信・永続保存に含めない。
行動末尾の「。」（間の空白を含む）を除き、句点を1つだけ追加する。
句点処理後に空になる行動は拒否。表示・Clipboard・手動コピー欄は同じ文字列。
ユーザー入力は textContent / value で表示する。

入力はJSメモリとフォームDOMだけで保持。戻る際には保持し、
再実行・再読み込み・BFCache復帰では初期化する。
新規アクセス時はハッシュにかかわらずSTART。不正ハッシュもSTARTへ戻す。
存在しない物理パスはホスティング側の404とする。
コピー操作をした場合、文章はOSのクリップボードに残ることがある。

## ローカルでの再現

開始前に対象remote、branch、HEAD、最新main、作業差分を確認する。
最新mainが基準SHAと異なる、または既存変更がある場合は停止して報告する。
ここに記載したGitコマンドは読み取りのみ。

```sh
git remote -v
git branch --show-current
git rev-parse HEAD
git ls-remote origin refs/heads/main
git status --short --untracked-files=all
git diff --exit-code 2b8bcdd4da5293dd7834222b0afad03abd1628e4 -- index.html assets/styles.css js/app.js js/config.js js/diagnosis-data.js js/diagnosis.js
```

リポジトリルートから（Node/npm、Python 3が必要）：

```sh
cd osusowake/_tests
npm ci --ignore-scripts --no-fund --cache /tmp/osusowake-npm-cache
npx playwright install chromium
npm test
```

インストール済みChromiumを使用する場合、ブラウザダウンロードは不要：

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

テストは localhost の `/action-switch-site/` 配下で実行。
外部LINEへの実遷移・友だち追加は行わない。確認済み設定のテストは
ブラウザ内のリクエスト置換だけで行い、実際のconfig.jsは空欄・falseを維持。
画面・48通りの既存結果・コピー・入力境界・安全性・レイアウト・axe AAを検証。
BFCacheはpersistedイベントの合成検証であり、実機の復元動作保証ではない。
IMEの自動テストも合成イベントであり、実機の日本語キーボード確認が別途必要。
200%相当はCSS viewportの縮小検証であり、実ブラウザのズーム操作とは区別する。
結果JSONは `_tests/test-results/results.json`（Git対象外）。

## ローカル公開相当ビルド

過去のPagesログと同じ `ghcr.io/actions/jekyll-build-pages:v1.0.13` を使う。
確認したイメージdigest：
`sha256:6791ebfd912185ed59bfb5fb102664fa872496b79f87ff8b9cfba292a7345041`。
GitHub上の現在設定はAPIで未確認。これは過去の配信構成との比較検証である。

リポジトリルートで実行する。Dockerソケットの接続先は、管理環境では
スキルに従ってローカルデーモンを明示する。ソースは読み取り専用、
出力先だけを書き込み可能にする。外部通信なしでビルドする。

```sh
mkdir -p osusowake/_tests/build/action-switch-site
docker run --rm --network none --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$PWD,dst=/github/workspace,readonly" \
  --mount "type=bind,src=$PWD/osusowake/_tests/build/action-switch-site,dst=/build" \
  -e GITHUB_WORKSPACE=/github/workspace \
  -e GITHUB_REPOSITORY=Mykey8376/action-switch-site \
  -e INPUT_SOURCE=. -e INPUT_DESTINATION=../../build \
  -e INPUT_BUILD_REVISION=2b8bcdd4da5293dd7834222b0afad03abd1628e4 \
  -e INPUT_VERBOSE=true \
  ghcr.io/actions/jekyll-build-pages:v1.0.13
cd osusowake/_tests
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:built
```

ビルド後は成果物全体に `_tests/`・`_ops/`・node_modules・テスト生成物が
含まれないことを検証する。必要な新4資産の存在と、既存6ファイルのバイト一致、
除外ファイルのローカルHTTP 404も確認する。
ルートの `.nojekyll` やPages設定を変えると除外の前提が変わるため、無断変更禁止。

## 任意リンクと公開前のゲート

`js/config.js` は両リンクとも空欄・未確認のまま。
LINEは正しい遷移先と登録後の動作、診断は現在の公開動作を人間が確認するまで非表示。
URLの設定だけでは表示しない。許可するのはHTTPS、資格情報・クエリ・ハッシュなし、
LINEは lin.ee の短縮URL、診断は確認対象repoのルートURLのみ。
確認日・確認者・遷移先・登録後動作を公開レビューに残す。秘密情報をconfigに入れない。
登録なしで全機能が完結する。表示は結果画面の補助導線のみ。

公開候補（未公開・未確定）：
`https://mykey8376.github.io/action-switch-site/osusowake/`。
公開前に現在のPages設定を確認し、公開後はHTTPS、相対資産、404、更新反映、
既存URLと全機能、公開成果物からの資料除外を確認する。
QRは本番URL確定後に作り、Zoomチャットと同一URLを使う。
外部URL・QR・チャット掲載の運営許可、iPhone Safari / Android Chrome /
PC Chrome、VoiceOver / TalkBack、日本語IME、長押しコピーを実機確認する。

PHASE 3Aはローカル実装・テスト・差分報告まで。
コミット、プッシュ、PR作成、本番公開、Pages設定変更は別途承認が必要。
LINEアカウント操作、外部サービス設定変更、自動連絡は実施しない。

## 受入基準の判定

OS-01〜15は自動テストでローカル機能を確認可能。
OS-16は5幅のChromium模擬、OS-17はキーボード・axe・フォーカス等を確認するが、
いずれも実機・読み上げ確認は未実施として残す。
OS-18（本番QR/Zoom）、OS-19の本番HTTPS/配信確認、OS-20（運営承認）は
ローカルテストで合格扱いにしない。
最終の実行結果・失敗修正・残存リスクは末尾の検証記録に記載する。

## 復旧

ローカル段階では公開先を変更していないため本番復旧は不要。
公開後の問題は別途承認を受け、新特典追加コミットのみをrevertして再配信する。
既存・他者変更を巻き戻さず、force pushや全体resetは行わない。
リンクだけの問題なら新ページの設定だけを無効化する。
既存診断の回帰確認と、新特典URL・QR・チャット案内の扱いを人間が確認する。

## PHASE 3A 検証記録（2026-10-20 UTC）

開始時：remoteは `https://github.com/Mykey8376/action-switch-site.git`、
branchはmain、HEADと最新mainは基準SHAに一致、作業差分なし。
終了時：既存6ファイルの変更・ステージ済み差分なし。新規11ファイルはすべて
osusowake/配下に未追跡状態で存在する。コミット・プッシュ・PR・公開・設定変更なし。

環境：Node v24.19.0、npm 11.9.0、Playwright 1.56.1、
Chromium 151.0.7922.173（Linux）。実機Chrome/Safariの代替合格とはしない。

| 実行 | 合格 | 失敗 | skip / flaky |
| --- | ---: | ---: | ---: |
| ソースに対する最終テスト | 87 | 0 | 0 / 0 |
| Jekyll生成物に対するテスト | 87 | 0 | 0 / 0 |

各87件は新特典37件＋既存診断50件（48組合せ、ファイル一致、操作回帰）。
ソースの最終テスト開始は06:25:18 UTC、生成物は06:26:58 UTC。
初回84件では83合格・1失敗。ハッシュだけの同一文書内移動を新規アクセスと
誤認したテスト手順を修正し、新規アクセス相当の再読み込みを明示した。
句点間に空白がある入力も補強し、最終87件で全件合格した。
未解決の自動テスト失敗はない。

| 受入ID | ローカル判定と証跡の範囲 |
| --- | --- |
| OS-01 | 合格：登録なしで完走・コピー・再実行 |
| OS-02 | 合格：5画面の順序・表示切替 |
| OS-03 | 合格：未選択拒否、4択すべて進行可能 |
| OS-04 | 合格：任意・空欄・説明・160/161コードポイント。IMEは合成イベント |
| OS-05 | 合格：各欄必須、空白、40/41・120/121、句点のみ、時期初期値 |
| OS-06 | 合格：全3時期、句点なし/1個/複数/間に空白、Q2非混入 |
| OS-07 | 合格：戻る・履歴・保持・再編集後の最新結果 |
| OS-08 | 合格：localhostの実Clipboard、表示/書込/手動欄の一致 |
| OS-09 | 合格：API拒否・未対応の手動欄、フォーカスと全文選択 |
| OS-10 | 合格：全入力・旧結果・コピー通知の初期化 |
| OS-11 | 合格：直アクセス、更新、不正ハッシュ、物理404。BFCacheは合成検証 |
| OS-12 | 合格：HTML/JSを文字列表示。ダイアログ・画像要素生成なし |
| OS-13 | 合格：入力後通信なし、URL/History/Storage/Cookie/Cache/SWへ回答保存なし |
| OS-14 | 合格：未確認/不正リンク非表示、確認済み模擬設定だけ結果画面に表示 |
| OS-15 | 合格：既存6ファイルと生成物のバイト一致、48結果、戻る/コピー/再実行 |
| OS-16 | 一部合格：320/375/390/768/1440pxで横スクロールなし。実機未実施 |
| OS-17 | 一部合格：5画面axe AA違反0、キーボード、フォーカス、44px操作領域、200%相当。実読み上げ/実ズーム未実施 |
| OS-18 | 未実施：本番QR・Zoomチャット・別デバイス到達 |
| OS-19 | 一部合格：Jekyll、相対資産、ローカル404、資料除外。本番HTTPS/更新反映は未実施 |
| OS-20 | 未実施：運営の外部URL・QR・チャット掲載承認 |

公開相当ビルド：github-pages v232 / Jekyll v3.10.0、過去ログと同一イメージ。
ネットワークを無効化して成功。成果物は既存6ファイル、新特典4ファイル、
Jekyll標準テーマが生成した `assets/css/style.css` の計11ファイル。
`_tests/`・`_ops/`・依存・テスト結果は含まれず、当該URLはローカルで404。
初回のroot所有出力は出力ディレクトリ内だけ権限調整した。上の再現手順では
実行ユーザーを指定する。既存ソースの権限・内容は変更していない。

証跡（すべてGit対象外・公開成果物外）：

- `_tests/build/source-results.json`
- `_tests/build/built-results.json`
- `_tests/build/build.log`
- `_tests/build/manifest.txt`
- `_tests/test-results/start-375.png` / `q2-375.png` / `q3-375.png` / `result-375.png`

375pxの画面キャプチャは目視確認済み。スマホ実機での検証は未実施。
テスト入力はすべて架空の試験データで、実回答を収集していない。

既存ファイルのGit blob SHA（基準コミットと同一）：

```text
index.html             fcfb91d0c8c048f01890646aee9bfec1ad130762
assets/styles.css      fd896d54abab94fb1565128ce198e90e55db7d4b
js/app.js              b9c6fe45c12959519d0d6c88744004e5283664d1
js/config.js           bf2a8298d39affbb1b1e746b66618bcf0565f6be
js/diagnosis-data.js    b548155504d1a2c51d42522b5797df5e6a3800e7
js/diagnosis.js         205dae6ebdd57f97c45c662e9f47b4b6dd54af08
```

残存リスク：現在のPages設定・本番稼働、iPhone Safari/Android Chrome/PC Chrome、
読み上げ・実IME・実BFCache・長押しコピー、LINE遷移先と登録後動作、
運営承認は未確認。LINE・既存診断への任意リンクは空欄・falseを維持。
PHASE 4レビューと公開工程の明示的承認が必要。全20項目合格や公開可とは判定しない。
