import React, { Component } from "react";

class FileItem extends Component {
  state = {};
  render() {
    const item = this.props.item;
    const modified = new Date(item.lastModified).toLocaleString();
    return (
      <tr>
        <td colspan="2">{item.cleartext[0]}</td>
        <td className="rightAlign">1.35 KBytes</td>
        <td className="rightAlign">{modified}</td>
      </tr>
    );
  }
}

export default FileItem;