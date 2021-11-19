const Discord = require("discord.js")
const client = new Discord.Client()
const mongoose = require("mongoose")
const keep_alive = require('./keep_alive.js')
const CF = require('./config')

const RolesDB = require('./Models/RoleData')

client.on('ready', async() => {
client.user.setPresence({ activity: { name: CF.ServerMessage }, status: CF.ServerCase });
if (CF.VoiceID && client.channels.cache.has(CF.VoiceID)) client.channels.cache.get(CF.VoiceID).join().catch();
})


client.on("message", async(message) => {
if (!message.guild || message.author.bot || message.channel.type === 'dm') return;
let prefix = CF.Prefix.filter(p => message.content.startsWith(p))[0]; 
if (!prefix) return;
let args = message.content.split(' ').slice(1);
let command = message.content.split(' ')[0].slice(prefix.length); 

let embed = new Discord.MessageEmbed().setColor('RANDOM')


if(command == "rol-kayıt" || command == "wolyoveri") {
message.channel.send(`✅ Sunucu rolleri veritabaına yedeklendi`)    
//Kanal Save
message.guild.roles.cache.filter(x => x.name !== "@everyone").map(async(role) => {
let roleChannelOverwrites = [];    
message.guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
let channelPerm = c.permissionOverwrites.get(role.id);
let dataSave = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() }
roleChannelOverwrites.push(dataSave)
})

await RolesDB.findOne({RoleID: role.id}, async(err, data) => {    
if(!data) { 
const newData = new RolesDB({_id: new mongoose.Types.ObjectId(), GuildID: message.guild.id, RoleID: role.id, RoleName: role.name, RoleColor: role.hexColor, RolePermissions: role.permissions, RoleMembers: role.members.map(x => x.id), RolePosition: role.position, RoleHoisted: role.hoist, RoleSize: role.members.size, RolechannelOverwrites: roleChannelOverwrites}); newData.save().catch(e => console.log(e))
} else if(data) {
data.GuildID = message.guild.id; data.RoleName = role.name; data.RoleColor = role.hexColor; data.RoleMembers = role.members.map(gmember => gmember.id); data.RolePosition = role.position; data.RoleHoisted = role.hoist; data.RoleSize = role.members.size; data.RolechannelOverwrites = roleChannelOverwrites
data.save().catch(e => console.log(e))
}})})}


if(command == "rol-kur" || command == "yedek" || command === "backup") {
let rolID = args[0] 
if(!rolID) return message.channel.send(`Geçerli bir rol idsi belirtmelisin.`)
RolesDB.findOne({GuildID: message.guild.id, RoleID: rolID}, async(err, res) => {
if(!res) return message.channel.send(`Belirtilen idye ait veritabanında rol bulunamadı.`)    
let backupRole = await message.guild.roles.create({
data: {
name: res.RoleName,
color: res.RoleColor,
hoist: res.RoleHoisted,
permissions: res.RolePermissions,
position: res.RolePosition,
}, reason: "Wolyo Backup  :)"});

message.channel.send("Başarılı ✅ belirtilen idye ait veritabanında **${res.RoleName}** isimli rol bulundu ve rol yeniden oluşturulmaya başlanıyor")
if(!res) return;
setTimeout(() => {
let ChannelPerms = res.RolechannelOverwrites;
if (ChannelPerms) ChannelPerms.forEach((rolePerms, i) => {
let chl = role.guild.channels.cache.get(rolePerms.id);
if (!chl) return;
setTimeout(() => {
let channelPermDatas = {};
perm.allow.forEach(p => {channelPermDatas[p] = true;});
perm.deny.forEach(p => {channelPermDatas[p] = false;});
chl.createOverwrite(backupRole, channelPermDatas).catch(console.error)}, i*5000)})}, 5000);

let roleMembers = res.RoleMembers;
roleMembers.forEach((member, i) => {
let x = message.guild.members.cache.get(member);
if (!x || x.roles.cache.has(backupRole.id)) return;
setTimeout(() => {x.roles.add(backupRole.id).catch();}, i*2000)})
})}
})


mongoose.connect(CF.MongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
client.login(process.env.token).then(function(){console.log(`${client.user.tag} açıldı`)}, function(err){console.log('Token geçersiz.')})
