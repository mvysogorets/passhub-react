import React, { Component } from "react";
import axios from "axios";

import Card from "react-bootstrap/Card";

import InviteDiv from "./inviteDiv";
import UserTable from "./userTable";
import DelUserModal from "./delUserModal";

function cmp(o1, o2) {
  const u1 = o1.email.toUpperCase();
  const u2 = o2.email.toUpperCase();
  if (u1 < u2) {
    return -1;
  }
  if (u1 > u2) {
    return 1;
  }
  return 0;
}

class UserManagementPage extends Component {
  state = {
    users: [],
    me: "",
    delDialogData: { email: "", id: "", show: false },
  };

  onNewMail = (email) => {
    this.setState({ email });
    this.getPageData();
    console.log(email);
  };

  updatePage = () => {
    this.getPageData();
  };

  showDelDialog = (data) => {
    this.setState({
      delDialogData: { email: data.email, id: data.id, show: true },
    });
  };

  hideDelDialog = () => {
    this.setState({
      delDialogData: { email: "", id: "", show: false },
    });
  };

  userStatusCB = (data) => {
    console.log(data);
    axios
      .post("iam.php", {
        verifier: document.getElementById("csrf").getAttribute("data-csrf"),
        operation: data.operation,
        id: data.id,
        email: data.email,
      })
      .then((result) => {
        if (result.data.status === "Ok") {
          this.getPageData();
          return;
        }
        if (result.data.status === "login") {
          window.location.href = "expired.php";
          return;
        }
        alert(result.data.status);
      })
      .catch((error) => {
        alert(error);
      });
  };

  getPageData = () => {
    axios
      .post("../iam.php", {
        verifier: document.getElementById("csrf").getAttribute("data-csrf"),
        operation: "users",
      })
      .then((result) => {
        console.log(result);
        if (result.data.status === "Ok") {
          let users = result.data.users.sort(cmp);
          this.setState({
            users,
            me: result.data.me,
            delDialogData: { email: "", id: "", show: false },
          });
        }
        if (result.data.status === "login") {
          window.location.href = "expired.php";
          return;
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  componentDidMount() {
    this.getPageData();
  }

  render() {
    return (
      <Card className="col col-xl-10 phub-dialog">
        <Card.Header
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <h1>User Management</h1>
          <button
            type="button"
            className="close"
            style={{ fontSize: "inherit" }}
            aria-label="Close"
            onClick={() => {
              window.location.href = "index.php";
            }}
          >
            <svg width="18" height="18" style={{ stroke: "black" }}>
              <use href="#el-x"></use>
            </svg>
          </button>
        </Card.Header>
        <Card.Body>
          <DelUserModal
            data={this.state.delDialogData}
            updatePage={this.updatePage}
            hide={this.hideDelDialog}
          />
          <InviteDiv onNewMail={this.onNewMail} updatePage={this.updatePage} />
          <UserTable
            users={this.state.users}
            me={this.state.me}
            showDelDialog={this.showDelDialog}
            userStatusCB={this.userStatusCB}
          />
        </Card.Body>
      </Card>
    );
  }
}

export default UserManagementPage;
