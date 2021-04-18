import React, { Component } from "react";
import Dropdown from "react-bootstrap/Dropdown";

class UserRecord extends Component {
  state = {};

  changeRole = (newRole, oldRole) => {
    if (newRole !== oldRole) {
      this.props.userStatusCB({
        email: this.props.user.email,
        id: this.props.user._id,
        operation: newRole,
      });
    }
  };

  render() {
    let user = this.props.user;

    let role = "active";
    if (user.disabled) {
      role = "disabled";
    } else if (user.site_admin) {
      role = "admin";
    } else if (!user._id) {
      role = "invited";
    }
    this.role = role;

    const id = btoa(user.mail).replace(/=/g, "");

    let seen = "";
    if (this.props.user.status !== "invited") {
      seen = new Date(this.props.user.lastSeen).toLocaleString();
    }

    if (this.props.me) {
      return (
        <tr>
          <td></td>
          <td>
            <b>{role}</b>
          </td>
          <td className="email">
            <b>{user.email}</b>
          </td>
          <td>
            <b>{user.safe_cnt}</b>
          </td>
          <td>
            <b>{user.shared_safe_cnt}</b>
          </td>
          <td className="d-none d-lg-table-cell">
            <b>That's you</b>
          </td>
        </tr>
      );
    }
    if (role === "invited") {
      return (
        <tr>
          <td
            style={{ cursor: "pointer" }}
            onClick={() => {
              this.props.showDelDialog({ email: user.email, id: user.id });
            }}
          >
            <svg
              style={{
                strokeWidth: "0",
                fill: "red",
                width: "1em",
                height: "1em",
              }}
            >
              <use href="#cross"></use>
            </svg>
          </td>
          <td>authorized</td>
          <td className="email">{this.props.user.email}</td>
          <td></td>
          <td></td>
          <td className="d-none d-lg-table-cell"></td>
        </tr>
      );
    }
    return (
      <tr>
        <td
          style={{ cursor: "pointer" }}
          onClick={() => {
            this.props.showDelDialog({ email: user.email, id: user.id });
          }}
        >
          <svg
            style={{
              strokeWidth: "0",
              fill: "red",
              width: "1em",
              height: "1em",
            }}
          >
            <use href="#cross"></use>
          </svg>
        </td>
        <td>
          <Dropdown
            onSelect={(newRole) => {
              this.changeRole(newRole, this.role);
            }}
          >
            <Dropdown.Toggle
              id={id}
              style={{
                background: "transparent",
                color: "black",
                border: "none",
                boxShadow: "none",
              }}
            >
              {role}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="active">active</Dropdown.Item>
              <Dropdown.Item eventKey="disabled">disabled</Dropdown.Item>
              <Dropdown.Item eventKey="admin">admin</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </td>
        <td className="email">{this.props.user.email}</td>
        <td>{user.safe_cnt}</td>
        <td>{user.shared_safe_cnt}</td>
        <td className="d-none d-lg-table-cell">
          {new Date(this.props.user.lastSeen).toLocaleString()}
        </td>
      </tr>
    );
  }
}

export default UserRecord;
