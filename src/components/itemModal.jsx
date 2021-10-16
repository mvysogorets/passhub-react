import React, { Component } from "react";

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import ItemModalFieldNav from "./itemModalFieldNav";
import ItemViewIcon from "./itemViewIcon";
import ModalCross from "./modalCross";

import { putCopyBuffer } from "../lib/copyBuffer";

class ItemModal extends Component {
  state = {
    edit: true,
    title: "",
    note: "",
    errorMsg: "",
  };

  isShown = false;

  constructor(props) {
    super(props);
    this.titleInput = React.createRef();
  }

  onTitleChange = (e) => this.setState({ title: e.target.value, errorMsg: "" });

  onNoteChange = (e) => this.setState({ note: e.target.value });

  onShow = () => {
    this.state.edit && this.titleInput.current.focus();
  };

  onClose = () => {
    this.props.onClose();
  };

  onSubmit = () => {
    this.state.title = this.state.title.trim();
    if (this.state.title == "") {
      this.setState({ errorMsg: "Please set a title" });
      return;
    }
    this.props.onSubmit(this.state.title, this.state.note);
  };

  onEdit = () => {
    this.setState({ edit: true });
    if (this.props.onEdit) {
      this.props.onEdit();
    }
  };

  setTitle = (aTitle) => {
    this.setState({ title: aTitle });
  };

  handleMove = () => {
    putCopyBuffer({ item: this.props.args.item, operation: "move" });
    this.props.onClose();
  };

  handleCopy = () => {
    putCopyBuffer({ item: this.props.args.item, operation: "copy" });
    this.props.onClose();
  };

  onView = () => {};

  render() {
    if (!this.props.show) {
      this.isShown = false;
      return null;
    }

    let path = [];
    let folderName = "";
    if (this.props.args.item) {
      path = this.props.args.item.path;
    } else if (this.props.args.folder) {
      path = this.props.args.folder.path;
    }

    folderName = path[path.length - 1];

    const pathString = path.join(" > ");
    /*
    if (this.props.args.folder) {
      path = this.props.args.folder.path.join(" > ");
      folderName =
        this.props.args.folder.path[this.props.args.folder.path.length - 1];
    }
*/

    if (!this.isShown) {
      this.isShown = true;
      this.state.errorMsg = "";
      if (this.props.args.item) {
        this.state.title = this.props.args.item.cleartext[0];
        this.state.note = this.props.args.item.cleartext[4];
        this.state.edit = false;
      } else {
        this.state.title = "";
        this.state.note = "";
        this.state.edit = true;
      }
    }

    let modalClass = this.state.edit ? "edit" : "view";

    return (
      <Modal
        show={this.props.show}
        onShow={this.onShow}
        onHide={this.onClose}
        animation={false}
        centered
      >
        <ModalCross onClose={this.props.onClose}></ModalCross>
        <div
          className="d-sm-none green70"
          style={{ cursor: "pointer", margin: "18px 0" }}
          onClick={() => {
            this.props.onClose();
            /*
            if (this.props.searchMode) {
              this.props.onSearchClear();
            }

            if (folder.SafeID) {
              this.props.openParentFolder(folder);
            } else {
              document.querySelector("#safe_pane").classList.remove("d-none");
              document.querySelector("#table_pane").classList.add("d-none");
            }
            */
          }}
        >
          <svg
            width="24"
            height="24"
            style={{
              fill: "#009a50",
              transform: "rotate(90deg)",
            }}
          >
            <use href="#angle"></use>
          </svg>
          {folderName}
        </div>

        <div class="itemModalNav">
          <div className="itemModalPath d-none d-sm-block">{pathString}</div>
          {!this.state.edit && (
            <div className="itemModalTools">
              {/*
                <ItemViewIcon iconId="#f-history" opacity="1" title="History" />
                */}
              <ItemViewIcon
                iconId="#f-move"
                title="Move"
                onClick={this.handleMove}
              />
              <ItemViewIcon
                iconId="#f-copy"
                title="Copy"
                onClick={this.handleCopy}
              />
              <ItemViewIcon
                iconId="#f-trash"
                title="Delete"
                onClick={this.props.args.openDeleteItemModal}
              />
              <div class="itemModalEditButton" onClick={this.onEdit}>
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#00BC62"
                  style={{
                    verticalAlign: "unset",
                    marginRight: "10px",
                  }}
                >
                  <use href="#f-edit"></use>
                </svg>
                <span style={{ verticalAlign: "top" }}>Edit</span>
              </div>
            </div>
          )}
        </div>

        {this.state.edit ? (
          <Form.Control
            className="ModalTitle h2"
            ref={this.titleInput}
            type="text"
            onChange={this.onTitleChange}
            value={this.state.title}
            spellCheck="false"
            placeholder="Title"
          />
        ) : (
          <React.Fragment>
            <div className="itemModalTitle">
              <div className="h2">{this.state.title}</div>
            </div>
            <div
              style={{
                // position: "absolute",
                width: "100%",
                height: "1px",
                // left: 0,
                // top: "130px",
                background: "#E7E7EE",
              }}
            ></div>
          </React.Fragment>
        )}

        <Modal.Body className={modalClass}>
          {this.state.errorMsg && (
            <div style={{ color: "red" }}>{this.state.errorMsg}</div>
          )}
          {this.props.children}

          <div className="itemNoteModalField">
            <ItemModalFieldNav name="Note" />
            <div>
              {this.state.edit ? (
                <textarea
                  className="notes"
                  onChange={this.onNoteChange}
                  readOnly={!this.state.edit}
                  spellCheck={false}
                  value={this.state.note}
                  style={{ width: "100%" }}
                  rows="5"
                  placeholder="Type notes here"
                ></textarea>
              ) : (
                <div class="note-view">{this.state.note}</div>
              )}
            </div>
          </div>
        </Modal.Body>
        {this.props.errorMsg && this.props.errorMsg.length > 0 && (
          <div style={{ color: "red" }}>{this.props.errorMsg}</div>
        )}

        {this.state.edit && (
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={this.onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={this.onSubmit}>
              Save
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    );
  }
}

export default ItemModal;
