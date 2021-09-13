export default function (e) {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
}
