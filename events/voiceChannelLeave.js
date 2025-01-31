import { players, manager, queues, skipVotes } from "../utils/soundplayer.js";
import AwaitRejoin from "../utils/awaitrejoin.js";
import { random } from "../utils/misc.js";

export default async (client, cluster, worker, ipc, member, oldChannel) => {
  if (!oldChannel) return;
  const connection = players.get(oldChannel.guild.id);
  if (connection && connection.type === "music" && oldChannel.id === connection.voiceChannel.id) {
    if (oldChannel.voiceMembers.filter((i) => i.id !== client.user.id).length === 0) {
      connection.player.pause(true);
      const waitMessage = await client.createMessage(connection.originalChannel.id, "🔊 Waiting 10 seconds for someone to return...");
      const awaitRejoin = new AwaitRejoin(oldChannel, true);
      awaitRejoin.on("end", (rejoined, member) => {
        if (rejoined) {
          connection.player.pause(false);
          players.set(connection.voiceChannel.guild.id, { player: connection.player, type: connection.type, host: member.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel, loop: connection.loop, shuffle: connection.shuffle, playMessage: connection.playMessage });
          waitMessage.edit(`🔊 ${member.mention} is the new voice channel host.`);
        } else {
          try {
            if (waitMessage.channel.messages.get(waitMessage.id)) waitMessage.delete();
          } catch {
            // no-op
          }
          connection.player.stop(connection.originalChannel.guild.id);
          manager.leave(connection.originalChannel.guild.id);
          connection.player.destroy();
          players.delete(connection.originalChannel.guild.id);
          queues.delete(connection.originalChannel.guild.id);
          skipVotes.delete(connection.originalChannel.guild.id);
          client.createMessage(connection.originalChannel.id, "🔊 The current voice channel session has ended.");
        }
      });
    } else if (member.id === connection.host) {
      const waitMessage = await client.createMessage(connection.originalChannel.id, "🔊 Waiting 10 seconds for the host to return...");
      const awaitRejoin = new AwaitRejoin(oldChannel, false, member.id);
      awaitRejoin.on("end", (rejoined) => {
        if (rejoined) {
          try {
            if (waitMessage.channel.messages.get(waitMessage.id)) waitMessage.delete();
          } catch {
            // no-op
          }
        } else {
          const members = oldChannel.voiceMembers.filter((i) => i.id !== client.user.id);
          if (members.length === 0) {
            try {
              if (waitMessage.channel.messages.get(waitMessage.id)) waitMessage.delete();
            } catch {
              // no-op
            }
            connection.player.stop(connection.originalChannel.guild.id);
            manager.leave(connection.originalChannel.guild.id);
            connection.player.destroy();
            players.delete(connection.originalChannel.guild.id);
            queues.delete(connection.originalChannel.guild.id);
            skipVotes.delete(connection.originalChannel.guild.id);
            client.createMessage(connection.originalChannel.id, "🔊 The current voice channel session has ended.");
          } else {
            const randomMember = random(members);
            players.set(connection.voiceChannel.guild.id, { player: connection.player, type: connection.type, host: randomMember.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel, loop: connection.loop, shuffle: connection.shuffle, playMessage: connection.playMessage });
            waitMessage.edit(`🔊 ${randomMember.mention} is the new voice channel host.`);
          }
        }
      });
    } else if (member.id === client.user.id) {
      connection.player.stop(connection.originalChannel.guild.id);
      manager.leave(connection.originalChannel.guild.id);
      connection.player.destroy();
      players.delete(connection.originalChannel.guild.id);
      queues.delete(connection.originalChannel.guild.id);
      skipVotes.delete(connection.originalChannel.guild.id);
      await client.createMessage(connection.originalChannel.id, "🔊 The current voice channel session has ended.");
    }
  }
};