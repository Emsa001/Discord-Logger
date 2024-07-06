import dotenv from "dotenv";
dotenv.config();

import { AttachmentBuilder, ChannelType, Client, GatewayIntentBits, NewsChannel, TextChannel } from "discord.js";
import createChannels from "./create";
import clearTargetGuildChannels from "./clean";
import fs from "fs";
import path from "path";
import { downloadFile } from "./file";
import moment from "moment";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

if (!process.env.READ_SERVER) {
    console.error("READ_SERVER is not defined");
    process.exit(1);
}
if (!process.env.WRITE_SERVER) {
    console.error("WRITE_SERVER is not defined");
    process.exit(1);
}

client.on("ready", async () => {
    if (!client.user) return console.error("Client user is null");
    console.log(`Logged in as ${client.user.tag}!`);

    // await clearTargetGuildChannels(client.guilds.cache.get(process.env.WRITE_SERVER || ""));
    // await createChannels(client);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.guildId !== process.env.READ_SERVER) return;

    const targetGuild = client.guilds.cache.get(process.env.WRITE_SERVER || "");
    if (!targetGuild) {
        console.error("Target guild not found!");
        return;
    }
    const targetChannel = targetGuild.channels.cache.find((c:any) => c.topic === message.channel.id) as TextChannel;
    if (!targetChannel) {
        console.error("Target channel not found!");
        return;
    }

    const files: any[] = [];

    for (const attachment of message.attachments.values()) {
        const filepath = path.join(__dirname, attachment.name);
        await downloadFile(attachment.url, filepath);
        files.push(new AttachmentBuilder(filepath));
    }

    let replyOptions:any = {
        content: `**${message.author.tag} ▸** ${message.content}`,
        embeds: message.embeds,
        files: files,
    };

    if (message.reference) {
        const referenceMessage = await message.channel.messages.fetch(message.reference.messageId || "");
        const targetReferenceMessage = await targetChannel.messages.fetch({ limit: 100 }).then(messages => 
            messages.find(msg => msg.content.includes(referenceMessage.author.tag) && msg.content.includes(referenceMessage.content.slice(0, 20)))
        );

        if (targetReferenceMessage) {
            replyOptions = { ...replyOptions, reply: { messageReference: targetReferenceMessage.id } };
        }
    }

    await targetChannel.send(replyOptions);

    // Remove the files after sending
    files.forEach(file => fs.unlinkSync(file.attachment));
});


client.login(process.env.TOKEN);
