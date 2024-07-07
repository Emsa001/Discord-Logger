import { ChannelType, AttachmentBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { downloadFile } from "./file";
import moment from "moment";

// Function to clone a channel with its messages and attachments
async function cloneChannel(sourceChannel, targetGuild, categoryMap) {
    try {
        if (targetGuild.channels.cache.some((c) => c.topic === sourceChannel.id && c.type === ChannelType.GuildText))
            return console.log(`Channel ${sourceChannel.name} already exists in target guild.`);

        // Create the channel in the target guild
        const targetChannel = await targetGuild.channels.create({
            name: sourceChannel.name,
            type: sourceChannel.type,
            topic: sourceChannel.id,
            nsfw: sourceChannel.nsfw,
            parent: sourceChannel.parentId ? categoryMap[sourceChannel.parentId] : null,
            position: sourceChannel.position
        });

        console.log(`Created channel ${sourceChannel.name} in target guild.`);

        // Fetch and clone messages from the source channel
        let messages: any[] = [];
        let lastMessageId;
        while (true) {
            const fetchedMessages = await sourceChannel.messages.fetch({ limit: 100, before: lastMessageId });
            if (fetchedMessages.size === 0) break;
            messages = messages.concat(Array.from(fetchedMessages.values()));
            lastMessageId = fetchedMessages.last().id;
        }

        messages.reverse(); // Send messages in the correct order

        for (const message of messages) {
            let files: any[] = [];
            if (message.attachments.size > 0) {
                for (const attachment of message.attachments.values()) {
                    const filepath = path.join(__dirname, attachment.name);
                    await downloadFile(attachment.url, filepath);
                    files.push(new AttachmentBuilder(filepath));
                }
            }

            const date = moment(message.createdAt).format("YYYY-MM-DD HH:mm:ss");
            const dateString = "`[" + date + "]`";
            await targetChannel.send({
                // content: `[${date}] ${message.content}`,
                content: `${dateString} **${message.author.tag} ▸** ${message.content}`,
                embeds: message.embeds,
                files: files
            });

            // Remove the files after sending
            files.forEach(file => fs.unlinkSync(file.attachment));

            console.log(`Cloned message from ${sourceChannel.name} to ${targetChannel.name}`);
        }
    } catch (error) {
        console.error(`Error cloning channel ${sourceChannel.name}:`, error);
    }
}

async function createChannels(client) {
    try {
        const sourceGuild = await client.guilds.fetch(process.env.READ_SERVER || "");
        const targetGuild = await client.guilds.fetch(process.env.WRITE_SERVER || "");

        if (!sourceGuild) {
            console.error("Source guild not found!");
            return;
        }
        if (!targetGuild) {
            console.error("Target guild not found!");
            return;
        }

        // Fetch all channels from the source guild, including categories
        const sourceChannels = sourceGuild.channels.cache;

        // Create a mapping of category names to category objects in the target guild
        const categoryMap = {};

        // Create categories in the target guild first
        for (const channel of sourceChannels.values()) {
            if (channel.type === ChannelType.GuildCategory) {
                // Check if a category with the same name already exists in the target guild
                let targetCategory = targetGuild.channels.cache.find((c) => c.name === channel.name && c.type === ChannelType.GuildCategory);
                if (!targetCategory) {
                    // Create the category in the target guild
                    targetCategory = await targetGuild.channels.create({
                        name: channel.name,
                        type: ChannelType.GuildCategory,
                        position: channel.position,
                    });
                    console.log(`Created category ${channel.name} in target guild.`);
                } else {
                    console.log(`Category ${channel.name} already exists in target guild.`);
                }
                // Map the category name to the created category
                categoryMap[channel.id] = targetCategory.id;
            }
        }

        // Now create text channels in the target guild, assigning them to the correct categories
        for (const channel of sourceChannels.values()) {
            if (channel.type === ChannelType.GuildText) {
                await cloneChannel(channel, targetGuild, categoryMap);
            }
        }
    } catch (error) {
        console.error("Error fetching guilds or channels:", error);
    }
}

export default createChannels;