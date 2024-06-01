let trie = null;
let codeOwnersFileContent = "";
let codeownersObjForUniqueness = [];

class TrieNode {
  constructor() {
    this.children = {};
    this.codeowner = null;
  }
}

class CodeOwnerTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(path, codeowner) {
    const parts = path.split("/");
    let node = this.root;
    for (const part of parts) {
      if (!node.children[part]) {
        node.children[part] = new TrieNode();
      }
      node = node.children[part];
    }
    node.codeowner = codeowner;
  }

  search(filePath) {
    const parts = filePath.split("/");
    let node = this.root;
    let lastCodeowner = null;
    for (const part of parts) {
      if (node.children[part]) {
        node = node.children[part];
        if (node.codeowner !== null) {
          lastCodeowner = node.codeowner;
        }
      } else {
        break;
      }
    }
    return lastCodeowner;
  }
}

const getCodeownersFileContent = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["codeowners"], (result) => {
      if (result.codeowners) {
        resolve(result.codeowners);
      } else {
        reject();
      }
    });
  });
};

const buildTrie = (codeownersFileContent) => {
  const codeownersArray = codeownersFileContent
    .split("\n")
    .filter((line) => line.length > 0);
  const trie = new CodeOwnerTrie();

  for (const line of codeownersArray) {
    const [path, codeowner] = line.split(/\s+/); // assuming space separates path and codeowner
    if (path && codeowner) {
      trie.insert(path, codeowner);
    }
  }

  return trie;
};

const getCodeowner = (fileName) => {
  return trie?.search(fileName);
};

const addCodeownerToElement = () => {
  const fileContainers = document.querySelectorAll("copilot-diff-entry");
  for (const fileContainer of fileContainers) {
    const codeownerClass = fileContainer.querySelector(".codeowner");

    if (codeownerClass) continue;

    const fileInfoContainer = fileContainer.querySelector(".file-info");
    const fileName = fileContainer.getAttribute("data-file-path");

    const codeowner = getCodeowner(fileName);
    codeownersObjForUniqueness[codeowner] = codeowner;

    const codeownerElement = document.createElement("div");
    codeownerElement.classList.add("codeowner");
    codeownerElement.textContent = codeowner || "No codeowner found";
    fileInfoContainer.append(codeownerElement);
  }
};

const createFileFilterElement = () => {
  const fileFilterElement = document.querySelector("file-filter");
  const codeownerFilter = document.querySelector(".custom-codeowner-filter");
  if (!fileFilterElement || codeownerFilter) return;

  const filterElement = document.createElement("file-filter");
  filterElement.setAttribute("data-target", "diff-file-filter.fileFilter");
  filterElement.setAttribute(
    "data-action",
    "file-filter-change:diff-file-filter#applyFilter"
  );
  filterElement.setAttribute("data-catalyst", "");
  filterElement.classList.add("custom-codeowner-filter");

  const detailsElement = document.createElement("details");
  detailsElement.classList.add(
    "diffbar-item",
    "details-reset",
    "details-overlay"
  );

  const summaryElement = document.createElement("summary");
  summaryElement.classList.add("Link--muted", "select-menu-button");
  summaryElement.setAttribute("aria-haspopup", "menu");
  summaryElement.setAttribute("data-target", "file-filter.summary");
  summaryElement.setAttribute("role", "button");

  const strongElement = document.createElement("strong");
  strongElement.classList.add(
    "js-file-filter-text",
    "css-truncate",
    "css-truncate-target"
  );
  strongElement.setAttribute("data-target", "file-filter.fileFilterActiveText");
  strongElement.textContent = "Codeowners";

  summaryElement.appendChild(strongElement);
  detailsElement.appendChild(summaryElement);

  const detailsMenuElement = document.createElement("details-menu");
  detailsMenuElement.classList.add("SelectMenu", "js-file-filter");
  detailsMenuElement.setAttribute("role", "menu");

  const selectMenuModalElement = document.createElement("div");
  selectMenuModalElement.classList.add("SelectMenu-modal");

  const headerElement = document.createElement("header");
  headerElement.classList.add("SelectMenu-header");

  const h3Element = document.createElement("h3");
  h3Element.classList.add("SelectMenu-title");
  h3Element.textContent = "Filter by codeowner";

  headerElement.appendChild(h3Element);
  selectMenuModalElement.appendChild(headerElement);

  const selectMenuListElement = document.createElement("div");
  selectMenuListElement.classList.add(
    "SelectMenu-list",
    "SelectMenu-list--borderless"
  );

  const formElement = document.createElement("form");
  formElement.classList.add("js-file-filter-form");
  formElement.setAttribute("data-turbo", "false");
  formElement.setAttribute("action", "/");
  formElement.setAttribute("accept-charset", "UTF-8");
  formElement.setAttribute("method", "post");

  const authenticityTokenInputElement = document.createElement("input");
  authenticityTokenInputElement.setAttribute("type", "hidden");
  authenticityTokenInputElement.setAttribute("name", "authenticity_token");
  authenticityTokenInputElement.setAttribute("value", "YOUR_AUTH_TOKEN"); // Replace with actual token
  authenticityTokenInputElement.setAttribute("autocomplete", "off");
  formElement.appendChild(authenticityTokenInputElement);

  const fieldsetElement = document.createElement("fieldset");

  const legendElement = document.createElement("legend");
  legendElement.classList.add("sr-only");
  legendElement.textContent = "Filter by codeowner";
  fieldsetElement.appendChild(legendElement);

  const codeownersArray = Object.keys(codeownersObjForUniqueness);
  console.log({ codeownersObjForUniqueness, codeownersArray });
  codeownersArray.forEach((codeowner) => {
    if (codeowner) {
      const labelElement = document.createElement("label");
      labelElement.classList.add("SelectMenu-item");
      labelElement.setAttribute("role", "menuitem");

      const inputElement = document.createElement("input");
      inputElement.classList.add("js-diff-file-type-option", "mr-2");
      inputElement.setAttribute("type", "checkbox");
      inputElement.setAttribute("value", codeowner);
      inputElement.setAttribute("name", "file-filters[]");
      console.log({ inputElement });

      labelElement.appendChild(inputElement);
      labelElement.append(` ${codeowner}`);
      fieldsetElement.appendChild(labelElement);
      inputElement.checked = true;
    }
  });

  formElement.appendChild(fieldsetElement);
  selectMenuListElement.appendChild(formElement);
  selectMenuModalElement.appendChild(selectMenuListElement);
  detailsMenuElement.appendChild(selectMenuModalElement);
  detailsElement.appendChild(detailsMenuElement);
  filterElement.appendChild(detailsElement);

  // Add the created element to the DOM
  const parentElement = fileFilterElement.parentElement; // Replace with actual parent selector
  if (parentElement) {
    parentElement.appendChild(filterElement);
  }
};

const addFilter = () => {
  createFileFilterElement();
};

window.onload = () => {
  getCodeownersFileContent()
    .then((codeownersFileContent) => {
      codeOwnersFileContent = codeownersFileContent;
      if (codeownersFileContent) {
        trie = buildTrie(codeownersFileContent);

        addCodeownerToElement();
        addFilter();
      }
    })
    .catch((error) => {
      console.error(error);
    });

  const mutationObserver = new MutationObserver((entries) => {
    for (const entry of entries) {
      if (entry.addedNodes.length > 0) {
        addCodeownerToElement();
        addFilter();
      }
    }
  });

  const body = document.querySelector("body");
  mutationObserver.observe(body, {
    childList: true,
    subtree: true,
  });
};
