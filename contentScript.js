let trie = null;

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

    const codeownerElement = document.createElement("div");
    codeownerElement.classList.add("codeowner");
    codeownerElement.textContent = codeowner || "No codeowner found";
    fileInfoContainer.append(codeownerElement);
  }
};

window.onload = () => {
  getCodeownersFileContent()
    .then((codeownersFileContent) => {
      if (codeownersFileContent) {
        trie = buildTrie(codeownersFileContent);

        addCodeownerToElement();
      }
    })
    .catch((error) => {
      console.error(error);
    });

  const mutationObserver = new MutationObserver((entries) => {
    for (const entry of entries) {
      if (entry.addedNodes.length > 0) {
        addCodeownerToElement();
      }
    }
  });

  const body = document.querySelector("body");
  mutationObserver.observe(body, {
    childList: true,
    subtree: true,
  });
};
