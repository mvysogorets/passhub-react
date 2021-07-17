import { updateTicket } from 'wwpass-frontend';

function keepTicketAlive(ttl, age) {
  const maxTicketAge = ttl / 2 + 30;
  let ticketTimeStamp = new Date() / 1000 - age;

  function CheckIdleTime() {
    const secondsNow = new Date() / 1000;

    if ((secondsNow - ticketTimeStamp) > maxTicketAge) {
      ticketTimeStamp = new Date() / 1000;
      updateTicket('update_ticket.php');
    }
  }
  window.setInterval(CheckIdleTime, 1000);
}

function serverLog(msg) {
  /*
  $.ajax({
    url: 'serverlog.php',
    type: 'POST',
    data: {
    //  verifier: csrf,
      msg,
    },
    error: () => {},
    success: () => {},
  });
  */
}

//https://en.wikipedia.org/wiki/List_of_the_most_common_passwords
const frequentPasswords = [
"01234567890",
"123123321",
"0000000000",
"1111111111",
"5555555555",
"6666666666",
"6969696969",
"7777777777",
"8888888888",
"09876543210",
"123qwe",
"1qaz2wsx3edc",
"1q2w3e4r5t",
"aa123456789",
"aaron431",
"administrator",
"access",
"ashley",
"asdfghjkl",
"azerty",
"baseball",
"bailey",
"batman",
"password1",
"passw0rd",
"picture1",
"abc123",
"charlie",
"donald",
"dragon",
"flower",
"football",
"freedom",
"google",
"iloveyou",
"letmein",
"loveme",
"lovely",
"master",
"million2",
"monkey",
"mustang",
"mynoob",
"princess",
"qazwsxedc",
"qqww1122",
"querty123",
"quertyiop",
"shadow",
"starwars",
"sunshine",
"superman",
"trustno1",
"welcome",
"whatever",
"zaq1zaq1",
"zxcvbnm",
"!@#$%^&*"
];

function isStrongPassword(pw) {
  if(pw.length < 6) {
    return false;
  }
  const lpw = pw.toLowerCase();
  for(const p of frequentPasswords) {
    if(p.indexOf(lpw) !== -1) {
      return false;
    }
  }
  return true;
}

function baseName(path) {
  var base = new String(path).substring(path.lastIndexOf('/') + 1);
  if (base.lastIndexOf(".") != -1) {
      base = base.substring(0, base.lastIndexOf("."));
  }
  return base;
}

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

function getFolderById(folderList, id) {
  for (const folder of folderList) {
    if (folder.id === id) {
      return folder;
    }
    const f = getFolderById(folder.folders, id);
    if (f) {
      return f;
    }
  }
  return null;
}

export {
  serverLog,
  isStrongPassword,
  keepTicketAlive,
  baseName,
  escapeHtml,
  getFolderById,
};
