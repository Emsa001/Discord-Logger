async function clearTargetGuildChannels(targetGuild) {
    try {
        const channels = targetGuild.channels.cache;
        
        for (const channel of channels.values()) {
            await channel.delete();
            console.log(`Deleted channel ${channel.name} (${channel.type})`);
        }
    } catch (error) {
        console.error('Error deleting channels:', error);
    }
}

export default clearTargetGuildChannels;