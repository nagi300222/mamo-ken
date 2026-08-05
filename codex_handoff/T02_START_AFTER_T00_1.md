# T02開始条件

T00.1監査補正がmainへマージされ、`node tools/audit_current_impl.mjs`のsource/dist contract checksが全てtrueになった後にT02を開始する。

T02では現行BAL、ギュイーンLegacy、咆哮、入力、CPU、Online protocolを変更しない。Core契約、Current/Provisional/Legacy分離、canonical snapshot、stable hash、10,000F決定論テストのみを導入する。