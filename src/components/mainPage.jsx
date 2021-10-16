import React, { Component } from "react";
import axios from "axios";
import IdleTimer from "react-idle-timer";
import * as passhubCrypto from "../lib/crypto";
import { keepTicketAlive, getFolderById } from "../lib/utils";
import * as extensionInterface from "../lib/extensionInterface";

import SafePane from "./safePane";
import TablePane from "./tablePane";
import ImportModal from "./importModal";
import IdleModal from "./idleModal";

import progress from "../lib/progress";

const mockData = {
  safes: [
    {
      name: "Mock Safe",
      id: 1,
      path: ["Mock Safe"],
      items: [],
      folders: [
        {
          SafeID: 1,
          id: "f1",
          path: ["Mock Safe", "Mock Folder"],
          name: "Mock Folder",
          cleartext: ["Mock Folder"],
          parent: 0,
          folders: [],
          lastModified: "2021-08-27T02:01:20+00:00",
          items: [
            {
              SafeID: 1,
              folder: "f1",
              cleartext: [
                "Gmail",
                "alice",
                "kjhgqw",
                "https://gmail.com",
                "Work mail",
              ],
              path: ["Mock Safe", "Mock Folder"],
              lastModified: "2021-08-27T02:01:20+00:00",
            },
          ],
        },
      ],
    },
    {
      name: "Private",
      id: 2,
      path: ["Private"],
      items: [],
      folders: [
        {
          SafeID: 2,
          id: "f21",
          path: ["Private", "SubFolder"],
          name: "SubFolder",
          cleartext: ["SubFolder"],
          parent: 0,
          folders: [],
          items: [],
        },
      ],
    },
    { name: "Work", id: 3, path: ["Work"], items: [], folders: [] },
  ],
};

function decryptSafeData(aesKey, safe) {
  for (let i = 0; i < safe.items.length; i += 1) {
    safe.items[i].cleartext = passhubCrypto.decodeItem(safe.items[i], aesKey);
  }

  for (let i = 0; i < safe.folders.length; i += 1) {
    safe.folders[i].cleartext = passhubCrypto.decodeFolder(
      safe.folders[i],
      aesKey
    );
  }
}

function decryptSafes(eSafes) {
  // console.log("xxx");
  const promises = [];
  for (let i = 0; i < eSafes.length; i++) {
    const safe = eSafes[i];
    if (safe.key) {
      promises.push(
        passhubCrypto.decryptAesKey(safe.key).then((bstringKey) => {
          safe.bstringKey = bstringKey;
          return decryptSafeData(bstringKey, safe);
        })
      );
    }
  }
  return Promise.all(promises);
}
function normalizeFolder(folder, items, folders) {
  folder.name = folder.cleartext[0];
  folder.id = folder._id;
  folder.path = [...folder.path, folder.cleartext[0]];

  folder.items = [];
  for (const item of items) {
    if (item.folder === folder.id) {
      folder.items.push(item);
      item.path = folder.path;
    }
  }
  folder.items.sort((a, b) =>
    a.cleartext[0].toLowerCase().localeCompare(b.cleartext[0].toLowerCase())
  );

  folder.folders = [];
  for (const f of folders) {
    if (f.parent === folder.id) {
      folder.folders.push(f);
      f.path = folder.path;
      f.safe = folder.safe;
      normalizeFolder(f, items, folders);
    }
  }
  folder.folders.sort((a, b) =>
    a.cleartext[0].toLowerCase().localeCompare(b.cleartext[0].toLowerCase())
  );
}

function normalizeSafes(safes) {
  for (const safe of safes) {
    safe.rawItems = safe.items;
    safe.path = [safe.name];
    safe.items = [];
    for (const item of safe.rawItems) {
      if (!item.folder || item.folder == "0") {
        safe.items.push(item);
        item.path = [safe.name];
      }
    }
    safe.items.sort((a, b) =>
      a.cleartext[0].toLowerCase().localeCompare(b.cleartext[0].toLowerCase())
    );

    safe.rawFolders = safe.folders;
    safe.folders = [];
    for (const folder of safe.rawFolders) {
      if (!folder.parent || folder.parent == "0") {
        safe.folders.push(folder);
        folder.path = [safe.name];
        folder.safe = safe;
        normalizeFolder(folder, safe.rawItems, safe.rawFolders);
      }
    }
    safe.folders.sort((a, b) =>
      a.cleartext[0].toLowerCase().localeCompare(b.cleartext[0].toLowerCase())
    );
  }
}

class MainPage extends Component {
  state = {
    safes: [],
    openNodes: new Set(),
    activeFolder: null,
    idleTimeoutAlert: false,
    showModal: "",
  };

  handleOpenFolder = (folder) => {
    const openNodesCopy = new Set(this.state.openNodes);
    if (this.state.openNodes.has(folder.id)) {
      openNodesCopy.delete(folder.id);
    } else {
      openNodesCopy.add(folder.id);
    }
    this.setState({ openNodes: openNodesCopy });
  };

  constructor(props) {
    super(props);
    this.safePaneRef = React.createRef();

    extensionInterface.connect(this.advise);

    document.addEventListener("passhubExtInstalled", function (data) {
      console.log("got passhubExtInstalled");
      extensionInterface.connect(this.advise);
    });
  }

  onAccountMenuCommand = (cmd) => {
    console.log("main: " + cmd);

    if (cmd === "Import") {
      this.setState({
        showModal: "ImportModal",
      });
      return;
    }

    this.safePaneRef.current.onAccountMenuCommand(cmd);
  };

  handleFolderMenuCmd = (node, cmd) => {
    this.safePaneRef.current.onFolderMenuCmd(node, cmd);
  };

  setActiveFolder = (folder) => {
    this.props.onSearchClear();

    if (folder.SafeID) {
      // isFolder
      const openNodesCopy = new Set(this.state.openNodes);
      let parentID = folder.parent;
      while (parentID != 0) {
        if (!this.state.openNodes.has(parentID)) {
          openNodesCopy.add(parentID);
        }
        let parentFolder = getFolderById(this.state.safes, parentID);
        parentID = parentFolder.parent;
      }
      if (!this.state.openNodes.has(folder.SafeID)) {
        openNodesCopy.add(folder.SafeID);
      }
      this.setState({ openNodes: openNodesCopy });
    }

    this.setState({ activeFolder: folder });
  };

  openParentFolder = (folder) => {
    if (!folder.SafeID) {
      return;
    }
    if (folder.parent == 0) {
      this.setActiveFolder(folder.safe);
    } else {
      const parent = getFolderById(this.state.safes, folder.parent);
      this.setActiveFolder(parent);
    }
  };

  refreshUserData = (newFolderID) => {
    let activeFolderID = this.state.activeFolder.id
      ? this.state.activeFolder.id
      : null;

    if (newFolderID) {
      activeFolderID = newFolderID;
    }

    const self = this;
    progress.lock();
    axios
      .post("../get_user_datar.php", {
        verifier: document.getElementById("csrf").getAttribute("data-csrf"),
      })
      .then((response) => {
        const result = response.data;
        if (result.status === "Ok") {
          const data = result.data;
          const safes = data.safes;
          return decryptSafes(safes).then(() => {
            safes.sort((a, b) =>
              a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            );
            normalizeSafes(safes);
            let activeFolder = getFolderById(data.safes, activeFolderID);
            console.log("activeFolder ", activeFolder);
            if (activeFolder === null) {
              console.log("old activesafe not found");
              activeFolder = getFolderById(data.safes, data.currentSafe);
            }
            if (activeFolder === null) {
              console.log("recommended activesafe not found");
              activeFolder = safes[0];
            }
            console.log("setting new state with updated data");
            progress.unlock();

            this.setState({
              safes,
            });
            this.setActiveFolder(activeFolder);
          });
          return;
        }
        if (result.data.status === "login") {
          window.location.href = "expired.php";
          return;
        }
      })
      .catch((error) => {
        progress.unlock();
        console.log(error);
      });
  };

  getPageData = () => {
    if (window.location.href.includes("mock")) {
      mockData.activeFolder = mockData.safes[0];
      mockData.safes[0].folders[0].safe = mockData.safes[0];
      mockData.safes[1].folders[0].safe = mockData.safes[1];
      this.setState(mockData);
      return;
    }

    const self = this;
    progress.lock();
    axios
      .post("../get_user_datar.php", {
        verifier: document.getElementById("csrf").getAttribute("data-csrf"),
      })
      .then((result) => {
        if (result.data.status === "Ok") {
          const data = result.data.data;

          passhubCrypto
            .getPrivateKey(data)
            .then(() => {
              return decryptSafes(data.safes).then(() => {
                data.safes.sort((a, b) =>
                  a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                );
                normalizeSafes(data.safes);
                data.activeFolder = getFolderById(data.safes, data.currentSafe);
                if (!data.activeFolder) {
                  console.log("active folder not found" + data.currentSafe);
                  data.activeFolder = data.safes[0];
                }
                progress.unlock();
                self.setState(data);

                keepTicketAlive(data.WWPASS_TICKET_TTL, data.ticketAge);
              });
            })
            .catch((err) => {
              if (window.location.href.includes("debug")) {
                alert(`387: ${err}`);
                return;
              }
              window.location.href = `error_page.php?js=387&error=${err}`;
            });
        }
        if (result.data.status === "login") {
          window.location.href = "expired.php";
          progress.unlock();
          return;
        }
      })
      .catch((error) => {
        progress.unlock();
        console.log(error);
      });
  };

  componentDidMount() {
    this.getPageData();
  }

  componentWillUnmount() {
    console.log("mainPage unmount");
  }

  handleOnIdle = () => {
    this.setState({ idleTimeoutAlert: true });

    this.logoutTimer = setTimeout(() => {
      document.location.href = "logout.php";
    }, 60 * 1000);

    console.log("handleOnIdle");
  };
  onActive() {
    console.log("userIactive");
  }

  onIdleModalClose = () => {
    console.log("onIdleModalClose");
    this.setState({ idleTimeoutAlert: false });
    clearTimeout(this.logoutTimer);
  };

  searchFolder = {
    path: ["Search results"],
    folders: [],
    items: [],
  };

  search(what) {
    const result = [];
    const lcWhat = what.toLowerCase();
    for (let s = 0; s < this.state.safes.length; s += 1) {
      if (this.state.safes[s].key) {
        // key!= null => confirmed, better have a class
        for (let i = 0; i < this.state.safes[s].rawItems.length; i += 1) {
          let item = this.state.safes[s].rawItems[i];
          let found = false;
          if (item.cleartext[0].toLowerCase().indexOf(lcWhat) >= 0) {
            found = true;
          } else if (item.cleartext[1].toLowerCase().indexOf(lcWhat) >= 0) {
            found = true;
          } else if (item.cleartext[3].toLowerCase().indexOf(lcWhat) >= 0) {
            found = true;
          } else if (item.cleartext[4].toLowerCase().indexOf(lcWhat) >= 0) {
            found = true;
          }
          if (found) {
            result.push(item);
          }
        }
      }
    }
    return result;
  }

  advise = (url) => {
    const u = new URL(url);
    let hostname = u.hostname.toLowerCase();
    if (hostname.substring(0, 4) === "www.") {
      hostname = hostname.substring(4);
    }
    const result = [];
    if (hostname) {
      for (let s = 0; s < this.state.safes.length; s += 1) {
        const safe = this.state.safes[s];
        if (safe.key) {
          // key!= null => confirmed, better have a class
          const items = safe.rawItems;
          for (let i = 0; i < items.length; i += 1) {
            try {
              let itemUrl = items[i].cleartext[3].toLowerCase();
              if (itemUrl.substring(0, 4) != "http") {
                itemUrl = "https://" + itemUrl;
              }

              itemUrl = new URL(itemUrl);
              let itemHost = itemUrl.hostname.toLowerCase();
              if (itemHost.substring(0, 4) === "www.") {
                itemHost = itemHost.substring(4);
              }
              if (itemHost == hostname) {
                result.push({
                  safe: safe.name,
                  title: items[i].cleartext[0],
                  username: items[i].cleartext[1],
                  password: items[i].cleartext[2],
                });
              }
            } catch (err) {}
          }
        }
      }
    }
    return result;
  };

  render() {
    if (!this.props.show) {
      return null;
    }
    const searchString = this.props.searchString.trim();
    if (searchString.length > 0) {
      this.searchFolder.items = this.search(searchString);

      const safePane = document.querySelector("#safe_pane");

      if (safePane && !safePane.classList.contains("d-none")) {
        document.querySelector("#safe_pane").classList.add("d-none");
        document.querySelector("#table_pane").classList.remove("d-none");
      }
    }

    const idleTimeout =
      "idleTimeout" in this.state ? this.state.idleTimeout : 0;

    return (
      <React.Fragment>
        <SafePane
          safes={this.state.safes}
          setActiveFolder={this.setActiveFolder}
          activeFolder={this.state.activeFolder}
          refreshUserData={this.refreshUserData}
          ref={this.safePaneRef}
          handleOpenFolder={this.handleOpenFolder}
          openNodes={this.state.openNodes}
          email={this.state.email}
        />
        <TablePane
          folder={
            searchString.length > 0
              ? this.searchFolder
              : this.state.activeFolder
          }
          safes={this.state.safes}
          searchMode={searchString.length > 0}
          setActiveFolder={this.setActiveFolder}
          openParentFolder={this.openParentFolder}
          refreshUserData={this.refreshUserData}
          inMemoryView={this.props.inMemoryView}
          onFolderMenuCmd={this.handleFolderMenuCmd}
          onSearchClear={this.props.onSearchClear}
          showItemPane={this.props.showItemPane}
        />

        {"idleTimeout" in this.state && (
          <div>
            <IdleTimer
              ref={(ref) => {
                this.idleTimer = ref;
              }}
              timeout={/*this.state.idleTimeout*/ idleTimeout * 1000}
              onIdle={this.handleOnIdle}
              onActive={this.onActive}
              debounce={250}
            />
          </div>
        )}

        <ImportModal
          show={this.state.showModal == "ImportModal"}
          safes={this.state.safes}
          onClose={(refresh = false) => {
            this.setState({ showModal: "" });
            if (refresh === true) {
              this.refreshUserData();
            }
          }}
        ></ImportModal>

        <IdleModal
          show={this.state.idleTimeoutAlert}
          onClose={this.onIdleModalClose}
        ></IdleModal>
      </React.Fragment>
    );
  }
}

export default MainPage;
