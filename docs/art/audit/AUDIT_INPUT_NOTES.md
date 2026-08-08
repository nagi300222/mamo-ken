# ART SIZE AUDIT INPUT NOTES

機械的に確認済み:
- 548 unique geometry frames
- old manifest battleScale=0.5 across audited frames
- offset.y + footAnchor.y = 0
- manifest vs independent alpha bbox height差 最大3px
- Dark common geometry matches Moguzo

重要:
これは旧scaleが正しいという結論ではない。
face-template自動判定は信頼性不足だったためFINAL判断には使わない。

FINAL implementationは:
standing target → own master face → ground
の順。
