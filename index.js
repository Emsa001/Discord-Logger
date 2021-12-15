const { Client, Intents, MessageEmbed, Permissions } = require("discord.js");

const db = require("./database/db");
const categories = require("./database/categories");
const channels = require("./database/channels");
const elmessages = require("./database/messages");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const {
  prefix,
  save_data_server,
  read_data_server,
  token,
} = require("./config.json");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  db.authenticate()
    .then(() => {
      console.log("Logged in to DB!");

      categories.init(db);
      categories.sync();

      channels.init(db);
      channels.sync();

      elmessages.init(db);
      elmessages.sync();
    })
    .catch((err) => console.log(err));
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.guild.id != read_data_server) return 0;
  const myGuild = client.guilds.cache.get(save_data_server);

  // LOGGER - start
  var category = await categories
    .findOne({
      where: {
        name: message.channel?.parent?.name || "",
        id: message.channel?.parent?.id || "",
      },
    })
    .catch((error) => console.log(error));

  var channel = await channels
    .findOne({
      where: {
        name: message.channel.name,
        id: message.channel.id,
      },
    })
    .catch((error) => console.log(error));

  if (!category) {
    if (message.channel.parent) {
      await categories
        .create({
          name: message.channel.parent.name,
          id: message.channel.parent.id,
          createdId: "",
        })
        .catch((err) => console.log(err));
      myGuild.channels
        .create(message.channel.parent.name, {
          type: "GUILD_CATEGORY",
        })
        .then(async (channel) => {
          console.log("ZAPIS CATEGORII");
          await categories
            .update(
              { createdId: channel.id },
              { where: { id: message.channel.parent.id } }
            )
            .catch((error) => console.log(error));
        });
    }
  }
  if (!channel) {
    await channels
      .create({
        name: message.channel.name,
        type: message.channel.type,
        id: message.channel.id,
      })
      .catch((err) => console.log(err));
    setTimeout(async () => {
      var ct1 = await categories
        .findOne({
          where: {
            name: message.channel?.parent?.name || "",
            id: message.channel?.parent?.id || "",
          },
        })
        .catch((error) => console.log(error));
      myGuild.channels
        .create(message.channel.name, {
          type: "GUILD_TEXT",
        })
        .then(async (channel) => {
          message.channel.parent ? channel.setParent(ct1.createdId) : 0;
          await channels
            .update(
              { createdId: channel.id },
              { where: { id: message.channel.id } }
            )
            .catch((error) => console.log(error));
        });
    }, 1000);
  }

  let atta = "";
  message.attachments.forEach((attachment) => {
    atta += `\nattachment.proxyURL`;
  });

  await elmessages
    .create({
      categoryID: message.channel.parent?.id || "none",
      categoryName: message.channel.parent?.name || "none",
      channelID: message.channel.id,
      channelName: message.channel.name,
      content: message.content,
      attachments: atta,
      author: message.author.tag,
    })
    .catch((err) => console.log(err));
  // LOGGER - end

  // WRITING
  setTimeout(async () => {
    var channel = await channels
      .findOne({
        where: {
          name: message.channel.name,
          id: message.channel.id,
        },
      })
      .catch((error) => console.log(error));

    if (message.type != "REPLY") {
      myGuild.channels.cache
        .find((i) => i.id === channel.createdId)
        .send(`** ${message.author.tag} ▸** ${message.content}`)
        .catch((err) => console.log(err));
    } else if (message.type == "REPLY") {
      myGuild.channels.cache
        .find((i) => i.id === channel.createdId)
        .send(
          `**▸ ${message.author.tag} (** Odpowiedział **${message.mentions.repliedUser.username}#${message.mentions.repliedUser.discriminator} ) ▸** ${message.content}`
        )
        .catch((err) => console.log(err));
    }
    message.attachments.forEach((attachment) => {
      const ImageLink = attachment.proxyURL;
      myGuild.channels.cache
        .find((i) => i.id === channel.createdId)
        .send(`${message.author.tag} - wysłał plik \n ${ImageLink}`)
        .catch((e) => console.log(e));
    });
  }, 2000);
});

client.login(token);
