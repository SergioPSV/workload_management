const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;
const address = "https://workloadmanagment.jnpstr.com/";
const configAdmins = {
    method: 'get',
    url: 'https://api.intercom.io/admins',
    headers: { 'Content-Type': 'application/json;charset=utf-8',
               'Authorization': 'Bearer dG9rOmE2OTMyYTkwX2RkNTlfNGJmMF9iYjYxXzg3NDY3ZDRlMGQxZjoxOjA=',
               'Accept': 'application/json'
             }
};

let adminId, adminsStatus, configCountChats;

let bots = [
  '326432',   //Facebook Bot
  '761712',   // Poster
  '3896431',   // Anna Kasianenko
  '4277540',   // Vladimir Siliveystr
  '4393949',   // Yana Tretiakova
  '3730256',  // Яна
  '1956517'  // Виктория Приходько
];
let exceptionsTeamId = [
  3027748,  // Chat Academy
  4309620,  // Franchise
  4309621,  // Dev Support
  5074091,  // Leads team
  1096273,  // Poster PL
  1883810   // English Team
];
let importantUserId = [
  'cup.joinposter.com',
  'zhatkin.joinposter.com',
  'kedy.joinposter.com',
  'kolizei.joinposter.com',
  'giperedcup.joinposter.com',
  'red-cup-chelyabinsk',
  'psyho-test.joinposter.com'
];

function assignAdmin(urlForAssign, adminId, counterMin) {
  console.log('assign this admin:  ↓ ' + counterMin);
  axios({
    method: 'post',
    url: urlForAssign,
    headers : {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': 'Bearer dG9rOmE2OTMyYTkwX2RkNTlfNGJmMF9iYjYxXzg3NDY3ZDRlMGQxZjoxOjA=',
            'Accept': 'application/json'
        },
    data: {
            "type": "admin",
            "admin_id": "761712",
            "assignee_id": adminId,
            "message_type": "assignment"
          }
        })
        .then(result => {console.log(result.data.admin_assignee_id, result.data.id);});
  }

  function sendNote(urlForNote) {
    console.log('Send note in chat ↓');
      axios({
        method: 'post',
        url: urlForNote,
        headers : {
                'Content-Type': 'application/json;charset=utf-8',
                'Authorization': 'Bearer dG9rOmE2OTMyYTkwX2RkNTlfNGJmMF9iYjYxXzg3NDY3ZDRlMGQxZjoxOjA=',
                'Accept': 'application/json'
            },
        data: {
                "message_type": "note",
                "type": "admin",
                "admin_id": "761712",
                "body": "Wait for assign"
              }
            })
            .then(result => {console.log(result.data.id);});
    }

    function counter(id) {
      configCountChats = {
        method: 'post',
        url: 'https://api.intercom.io/conversations/search',
        headers : {
                'Content-Type': 'application/json;charset=utf-8',
                'Authorization': 'Bearer dG9rOmE2OTMyYTkwX2RkNTlfNGJmMF9iYjYxXzg3NDY3ZDRlMGQxZjoxOjA=',
                'Accept': 'application/json'
            },
        data: {
               "query":  {
                  "operator": "AND",
                  "value": [
                    {
                      "field": "admin_assignee_id",
                      "operator": "=",
                      "value": id
                    },
                    {
                      "field": "state",
                      "operator": "=",
                      "value": "open"
                    }
                  ]
                }
              }
      }
    };

async function getAdminsStatus(urlForNote, urlForAssign, counterMin, teamAssigneeId) {
  sendNote(urlForNote);
  adminsStatus = await axios(configAdmins);

  for (let i=0; i<adminsStatus.data.admins.length; i++) {
    if (!adminsStatus.data.admins[i].away_mode_enabled && adminsStatus.data.admins[i].has_inbox_seat && !bots.includes(adminsStatus.data.admins[i].id) && !adminsStatus.data.admins[i].team_ids.includes(3027748) && !adminsStatus.data.admins[i].team_ids.includes(5074091) &&  !adminsStatus.data.admins[i].team_ids.includes(1096273) && !adminsStatus.data.admins[i].team_ids.includes(1883810)) {

      counter(adminsStatus.data.admins[i].id);

      let countChats = await axios(configCountChats);
      console.log(adminsStatus.data.admins[i].name, adminsStatus.data.admins[i].id, countChats.data.conversations.length);

      if (countChats.data.conversations.length < counterMin) {
        counterMin = countChats.data.conversations.length;
        adminId = adminsStatus.data.admins[i].id;
      }
    }
  }

assignAdmin(urlForAssign, adminId, counterMin);

}

async function giveAdminChat(urlForNote, urlForAssign, counterMin, teamAssigneeId) {
  sendNote(urlForNote);

  adminsStatus = await axios(configAdmins);

  for (let i=0; i<adminsStatus.data.admins.length; i++) {
    if (!adminsStatus.data.admins[i].away_mode_enabled && !bots.includes(adminsStatus.data.admins[i].id) && adminsStatus.data.admins[i].team_ids.includes(teamAssigneeId)) {

      counter(adminsStatus.data.admins[i].id);

      let countChats = await axios(configCountChats);

      console.log(adminsStatus.data.admins[i].name, countChats.data.conversations.length);

      if (countChats.data.conversations.length < counterMin) {
        counterMin = countChats.data.conversations.length;
        adminId = adminsStatus.data.admins[i].id;
      }
    }
  }

assignAdmin(urlForAssign, adminId, counterMin);

}

app.use(bodyParser.json());
app.post('/', function (req, res) {
  let timeNow = new Date();
  let convWebhook = req.body;
  let urlForNote = 'https://api.intercom.io/conversations/' + convWebhook.data.item.id + '/reply';
  let urlForAssign = 'https://api.intercom.io/conversations/' + convWebhook.data.item.id + '/parts';
  let counterMin = 500;
  let teamAssigneeId = convWebhook.data.item.team_assignee_id;

  if (convWebhook.data.item.type == "ping") {
    console.log(convWebhook.data.item.type);

    getAdminsStatus();

    res.json({
      message: 'ok'
      });
      return;
  };

  console.log('get webhook, ' + 'time: ', timeNow.getHours(), convWebhook.topic, convWebhook.data.item.id, "admin:",convWebhook.data.item.admin_assignee_id, "team:",convWebhook.data.item.team_assignee_id)


  if (timeNow.getHours() > 6) {
    if (!importantUserId.includes(convWebhook.data.item.user.user_id) && !exceptionsTeamId.includes(convWebhook.data.item.team_assignee_id)) {
      console.log('all Admins');
      getAdminsStatus(urlForNote, urlForAssign, counterMin, teamAssigneeId);
    };
    if (convWebhook.data.item.team_assignee_id == 4309620 || convWebhook.data.item.team_assignee_id == 3027748) {
      console.log('Only Admins Chat Academy // Franchise');
      giveAdminChat(urlForNote, urlForAssign, counterMin, teamAssigneeId);
    };
  }

    res.json({
      message: 'ok'
    });
  });

  const server = app.listen(port, function () {
  const host = server.address().address
  const port = server.address().port
  console.log('app v2.0 listening at http://%s:%s', host, port)
  });
