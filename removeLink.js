async function removeLink(text) {
  const findLink = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)/g;
  text.replace(findLink, "");
}

module.exports.removeLink = removeLink;
