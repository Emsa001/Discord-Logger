const { Client, Intents, MessageEmbed, Permissions } = require("discord.js");
const { Rcon } = require("rcon-client");

const db = require("./database/db");
const categories = require("./database/categories");
const channels = require("./database/channels");
const elmessages = require("./database/messages");
const settings = require("./database/settings");
const adminsettings = require("./database/adminsettings");

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
var supportchannel = "";
var supportchannelw = "";

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

      settings.init(db);
      settings.sync();

      adminsettings.init(db);
      adminsettings.sync();
    })
    .catch((err) => console.log(err));
  var x = true;
  client.user.setActivity(`${prefix}help`, { type: "PLAYING" });
  setInterval(async () => {
    var admsett = await adminsettings
      .findOne({
        where: {
          configID: 1,
        },
      })
      .catch((error) => console.log(error));

    if (x == true) {
      client.user.setActivity(`${admsett.servsers || 61} Serwerów`, {
        type: "WATCHING",
      });
      x = false;
    } else {
      client.user.setActivity(`${prefix}help`, { type: "PLAYING" });
      x = true;
    }
  }, 180000);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return 0;
  if (
    message.guild.id != read_data_server &&
    message.guild.id != save_data_server
  ) {
    return message.channel
      .send({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setTitle("❌ Błąd")
            .setDescription(`Ten serwer nie ma permisji do używania tego bota!`)
            .addFields(
              { name: "▸ Plan 30d", value: "9.99 PLN" },
              { name: "▸ Plan 90d", value: "24.99 PLN" },
              { name: "▸ Plan 180d", value: "39.99 PLN" },
              { name: "▸ Plan 360d", value: "61.99 PLN" },
              { name: "▸ Plan LifeTime", value: "149.99 PLN" }
            )
            .setFooter(
              `Aby zakupić plan skontaktuj się z CodeAlone#6870`,
              "https://cdn.discordapp.com/avatars/923577378574315520/06b83a95045c0537c441fc7578c48213.webp?size=80"
            ),
        ],
      })
      .catch((error) => console.log(error));
  }
  const myGuild = client.guilds.cache.get(save_data_server);

  if (supportchannelw != "" && supportchannel != "") {
    if (message.guild.id == save_data_server) {
      if (message.channel.id == supportchannelw) {
        return supportchannel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("BLUE")
                .setTitle("Wiadomość agenta:")
                .setDescription(message.content),
            ],
          })
          .catch((error) => console.log(error));
      }
    }
  }
  if (message.guild.id != read_data_server) return 0;
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
        .send(`**${message.author.tag}** - wysłał plik \n ${ImageLink}`)
        .catch((e) => console.log(e));
    });
  }, 3000);

  // ACUTALL BOT
  var x = true;
  var guild_settings = await settings
    .findOne({ where: { guildId: message.guild.id } })
    .catch((error) => console.log(error));

  if (message.channel.id == guild_settings?.consoleChat || "") {
    const rcon = await Rcon.connect({
      host: guild_settings.rcon_host,
      port: guild_settings.rcon_port,
      password: guild_settings.rcon_password,
    }).catch(() => {
      x = false;
      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setTitle(`Wystąpił błąd`)
              .setDescription(
                "Wystąpił błąd podczas próby połączenia z serwerem, upewnij się, że dane RCON są poprawnie wprowadzone."
              )
              .setFooter(
                `Komenda wysłana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));
    });
    if (x == false) return 0;

    var response = await rcon.send(message.content || "");
    var response2 = "";
    for (var i = 0; i < response.length; i++) {
      if (response[i] != "§") {
        response2 += response[i];
      } else {
        i++;
      }
    }

    try {
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .addField("Wysłana komenda:", `/${message.content}`)
              .addField(
                "Odpowiedź serwera:",
                `${
                  response2
                    ? response2
                    : "Wysłana komenda nie zwraca żadnej odpowiedzi"
                }`
              )

              .setFooter(
                `Komenda wysłana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));
    } catch {
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("RED")
              .setDescription(
                `**Wystąpił błąd, podczas wysyłania komendy:** ${message.content}`
              )
              .setFooter(
                `Komenda wysłana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));
    }

    return rcon.end().catch((err) => console.log(err));
  }
  if (!message.content.startsWith(prefix)) return 0;

  const commandBody = message.content.slice(prefix.length).trim();
  const args = commandBody.split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
    return message.react("❌").catch((err) => console.log(err));
  }
  switch (commandName) {
    case "help":
      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("BLUE")
              .setTitle(`Minecraft-DC ▸ Pomoc`)
              .addFields(
                {
                  name: "🗃 Ustawienia konsoli:",
                  value: "!settings",
                  inline: true,
                },
                {
                  name: "🔍 Połączenie z pomocą techniczną:",
                  value: "!support",
                  inline: true,
                },
                {
                  name: "🔑 Plan serwera:",
                  value: "LifeTime",
                  inline: true,
                },
                { name: "\u200B", value: "\u200B" },
                {
                  name: "🔐 Bezpieczeństwo:",
                  value:
                    "\n▸ Twoje dane RCON są przechowywane w sposób najbezpieczniejszy, wszystkie podane przez ciebie informacje są podwójnie hashowane\nPrzykładowe hasło `secretpassword` w naszej bazie danych będzie wyglądało w sposób następujący `c5de3553d97eda8c5b1d46698cedc9fe2d66425b`.\n\n▸ Dane są przypisane do serwera discord i żaden inny serwer nie ma do nich podglądu ani nie może ich edytować.\n\n▸ W przypadku dodatkowych pytań prosimy skontaktować się z naszą pomocą techniczną **!support**\n\n🔺 Tylko osoby mające prawa administratora mogą używać komend bota.",
                  inline: false,
                }
              )
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));
      break;

    case "zamknijticket":
      if (supportchannel == "") {
        return message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("RED")
                .setTitle("Nie masz otwartego połączenia z supportem")
                .setFooter(
                  `Komenda wywołana przez ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) => console.log(error));
      }
      supportchannel = "";
      supportchannelw = "";
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle("Zakończono połączenie z supportem")
              .setDescription(
                "Dziękujemy za kontakt z nami  i mamy nadzieję, że pomogliśmy rozwiązać twój problem."
              )
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));

      setTimeout(async () => {
        var channel = await channels
          .findOne({
            where: {
              name: message.channel.name,
              id: message.channel.id,
            },
          })
          .catch((error) => console.log(error));
        supportchannelw = channel.createdId;
        myGuild.channels.cache
          .find((i) => i.id === channel.createdId)
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("GREEN")
                .setTitle("ZAMKNIĘTO TICKET")
                .setDescription("Można już pisać głupoty")
                .setFooter(
                  `Ticket zamknął ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((err) => console.log(err));
      }, 3000);
      break;
    case "support":
      if (supportchannel != "") {
        return message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("RED")
                .setTitle("Już nawiązałeś połączenie z supportem")
                .setFooter(
                  `Komenda wywołana przez ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) => console.log(error));
      }
      supportchannel = message.channel;
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle("Stworzyłeś połączenie z supportem")
              .setDescription(
                "Opisz swój problem na tym chacie, nasz zespół zaraz się z tobą połączy.\nSupport będzie widział tylko wiadomości osoby, która stworzyła połączenie.\nUwaga Support nie widzi wysłanych wczesniej wysłanych wiadomości!"
              )
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));

      setTimeout(async () => {
        var channel = await channels
          .findOne({
            where: {
              name: message.channel.name,
              id: message.channel.id,
            },
          })
          .catch((error) => console.log(error));
        supportchannelw = channel.createdId;
        myGuild.channels.cache
          .find((i) => i.id === channel.createdId)
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("ORANGE")
                .setTitle("STWORZONO TICKET Z SUPPORTEM")
                .setDescription(
                  `UWAGA, OD TERAZ WSZYSTKIE WIADOMOŚCI, KTÓRE NAPISZESZ NA TYM CHACIE, BĘDĄ WYSYŁANE JAKO SUPPORT NA EL2 - NIE PISZ GŁUPOT xD\n\nA i napisałem, że widzimy tylko wiadomości osoby, która stworzyła ticketa - więc teorytycznie widzimy tylko wiadomości **${message.author.tag}**`
                )
                .setFooter(
                  `Ticket stworzył ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((err) => console.log(err));
      }, 3000);

      break;

    case "settings":
      message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle("Ustawienia twojego serwera")
              .addField(
                "Kanał konsoli:",
                guild_settings?.consoleChat || 0
                  ? `<#${guild_settings.consoleChat}>`
                  : `Użyj **${prefix}consolechan <#chat>** aby ustawić`
              )
              .addFields(
                {
                  name: "RCON host:",
                  value:
                    guild_settings?.rcon_host ||
                    `Użyj **${prefix}rhost** - aby ustawić`,
                },
                {
                  name: "RCON port:",
                  value:
                    guild_settings?.rcon_port ||
                    `Użyj **${prefix}rport** - aby ustawić`,
                },
                {
                  name: "RCON hasło:",
                  value: guild_settings?.rcon_password
                    ? "--------------"
                    : `Użyj **${prefix}rpass** - aby ustawić`,
                }
              )
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));
      break;
    case "rhost":
      if (!args[0]) {
        return message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("RED")
                .setTitle("Błąd")
                .setDescription(`Poprawne użycie: **${prefix}rhost <host>**`)
                .setFooter(
                  `Komenda wywołana przez ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) => console.log(error));
      }

      if (!guild_settings) {
        await settings
          .create({
            rcon_host: args[0],
            guildId: message.guild.id,
          })
          .catch((err) => console.log(err));
      } else {
        await settings
          .update(
            {
              rcon_host: args[0],
            },
            {
              where: { guildId: message.guild.id },
            }
          )
          .catch((err) => console.log(err));
      }

      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle("Poprawnie ustawiono HOST dla połączenia RCON")
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));

      break;

    case "rport":
      if (!args[0]) {
        return message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("RED")
                .setTitle("Błąd")
                .setDescription(`Poprawne użycie: **${prefix}rport <port>**`)
                .setFooter(
                  `Komenda wywołana przez ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) => console.log(error));
      }

      if (!guild_settings) {
        await settings
          .create({
            rcon_port: args[0],
            guildId: message.guild.id,
          })
          .catch((err) => console.log(err));
      } else {
        await settings
          .update(
            {
              rcon_port: args[0],
            },
            {
              where: { guildId: message.guild.id },
            }
          )
          .catch((err) => console.log(err));
      }

      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle("Poprawnie ustawiono PORT dla połączenia RCON")
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));

      break;

    case "rpass":
      if (!args[0]) {
        return message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("RED")
                .setTitle("Błąd")
                .setDescription(`Poprawne użycie: **${prefix}rpass <hasło>**`)
                .setFooter(
                  `Komenda wywołana przez ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) => console.log(error));
      }

      if (!guild_settings) {
        await settings
          .create({
            rcon_password: args[0],
            guildId: message.guild.id,
          })
          .catch((err) => console.log(err));
      } else {
        await settings
          .update(
            {
              rcon_password: args[0],
            },
            {
              where: { guildId: message.guild.id },
            }
          )
          .catch((err) => console.log(err));
      }

      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle("Poprawnie ustawiono HASŁO dla połączenia RCON")
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));

      break;

    case "consolechann":
      if (
        message.guild.channels.cache.get(args[0]?.replace(/\D/g, "")) ===
        undefined
      ) {
        return message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("RED")
                .setTitle("Błąd")
                .setDescription(
                  `Niepoprawny **chat**\nPoprawne użycie: **${prefix}consolechan <#chat>**`
                )
                .setFooter(
                  `Komenda wywołana przez ${message.author.tag}`,
                  `${client.user.displayAvatarURL()}`
                ),
            ],
          })
          .catch((error) => console.log(error));
      }

      if (!guild_settings) {
        await settings
          .create({
            consoleChat: args[0]?.replace(/\D/g, ""),
            guildId: message.guild.id,
          })
          .catch((err) => console.log(err));
      } else {
        await settings
          .update(
            {
              consoleChat: args[0]?.replace(/\D/g, ""),
            },
            {
              where: { guildId: message.guild.id },
            }
          )
          .catch((err) => console.log(err));
      }

      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setTitle("Poprawnie zmieniono chat conosli")
              .setDescription(
                `Chat konsoli serwera został zmieniony na ${args[0]}`
              )
              .setFooter(
                `Komenda wywołana przez ${message.author.tag}`,
                `${client.user.displayAvatarURL()}`
              ),
          ],
        })
        .catch((error) => console.log(error));

      break;
  }
});

client.login(token);
