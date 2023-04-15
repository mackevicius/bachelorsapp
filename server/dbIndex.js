//@ts-check
const CosmosClient = require('@azure/cosmos').CosmosClient;

const config = require('./dbConfig');

const endpoint = config.endpoint;

const key = config.key;

const databaseId = 'Playlists';

const playlistsContainer = 'playlists';
const votesContainer = 'votes';

const options = {
  endpoint: endpoint,
  key: key,
  userAgentSuffix: 'CosmosDBJavascriptQuickstart',
};

const client = new CosmosClient(options);

async function replaceFamilyItem(itemBody) {
  console.log(`Replacing item:\n${itemBody.id}\n`);
  itemBody.children = 'duh';
  const { item } = await client
    .database(databaseId)
    .container(playlistsContainer)
    .item(itemBody.id, itemBody.partitionKey)
    .replace(itemBody);
}

async function addPlaylist(id, name, description, imageUrl) {
  const newBody = {
    id,
    name,
    description,
    imageUrl,
    tracks: [],
  };

  const { item } = await client
    .database(databaseId)
    .container(playlistsContainer)
    .items.create(newBody);
}

async function deleteVote(trackId, userId) {
  await client
    .database(databaseId)
    .container(votesContainer)
    .item(trackId, userId)
    .delete();
}
async function addVote(trackId, userId, points, playlistId) {
  await client.database(databaseId).container(votesContainer).items.create({
    id: trackId,
    userId,
    points,
    playlistId,
  });
}

async function postVote(itemBody) {
  const { resources: results } = await client
    .database(databaseId)
    .container(playlistsContainer)
    .items.query(`SELECT * from c where c.id="${itemBody.playlistId}"`)
    .fetchAll();
  const newPlaylist = results[0];
  if (itemBody.points <= 0) {
    await deleteVote(itemBody.trackId, itemBody.userId);
  } else {
    await addVote(
      itemBody.trackId,
      itemBody.userId,
      itemBody.points,
      itemBody.playlistId
    );
  }
  newPlaylist.tracks.map((x) => {
    if (x.trackId === itemBody.trackId) {
      return {
        votes: (x.votes += itemBody.points),
        ...x,
      };
    }
    return x;
  });
  await client
    .database(databaseId)
    .container(playlistsContainer)
    .item(itemBody.playlistId)
    .replace(newPlaylist);
}

async function getUserVotes(userId, playlistId) {
  const { resources: results } = await client
    .database(databaseId)
    .container(votesContainer)
    .items.query(
      `SELECT * FROM c where c.userId="${userId}" and c.playlistId="${playlistId}"`
    )
    .fetchAll();
  let votes = ['5', '4', '3', '2', '1'];

  if (results) {
    results.map((vote) => {
      votes = votes.filter((x) => x !== vote.points);
    });
  }

  let newVotes = [];
  for (let i = 1; i <= 5; i++) {
    const match = results.find((vote) => vote.points === i);
    if (match) {
      newVotes.push({
        trackId: match.id,
        points: match.points,
      });
    } else {
      newVotes.push({
        trackId: null,
        points: i,
      });
    }
  }

  return JSON.stringify(newVotes);
}

async function updateTracks(newPlaylist, playlistId) {
  const { resource } = await client
    .database(databaseId)
    .container(playlistsContainer)
    .item(playlistId)
    .replace(newPlaylist);

  return resource;
}

async function getPlaylists() {
  const { resources: playlists } = await client
    .database(databaseId)
    .container(playlistsContainer)
    .items.query('SELECT * from c')
    .fetchAll();
  return playlists;
}

async function validateTracks(tracks, playlistId, userId) {
  const { resources: results } = await client
    .database(databaseId)
    .container(playlistsContainer)
    .items.query(`SELECT * from c where c.id="${playlistId}"`)
    .fetchAll();

  const { resources: votes } = await client
    .database(databaseId)
    .container(votesContainer)
    .items.query(
      `SELECT * FROM c where c.userId="${userId}" and c.playlistId="${playlistId}"`
    )
    .fetchAll();

  const trackArray = [];
  let updatedArray = [];
  if (results[0]) {
    const dbTracks = results[0].tracks;
    tracks.forEach((spotifyTrack, index) => {
      let votes = 0;
      const match = dbTracks.find((databaseTrack) => {
        return spotifyTrack.track.id === databaseTrack.trackId;
      });
      if (match) {
        votes = match.votes;
        trackArray[index] = {
          place: index,
          trackId: spotifyTrack.track.id,
          votes,
        };
      } else {
        trackArray[index] = {
          place: index,
          trackId: spotifyTrack.track.id,
          votes: 0,
        };
      }
    });
    votes.forEach(async (vote) => {
      if (!trackArray.find((track) => track.trackId === vote.id)) {
        await deleteVote(vote.id, vote.userId);
      }
    });

    const newPlaylist = {
      ...results[0],
      tracks: trackArray,
    };

    await updateTracks(newPlaylist, playlistId);

    const { resources: newResults } = await client
      .database(databaseId)
      .container(playlistsContainer)
      .items.query(`SELECT * from c where c.id="${playlistId}"`)
      .fetchAll();
    if (newResults) {
      updatedArray = newResults[0].tracks.map((x, index) => {
        return {
          ...tracks[index],
          place: x.place,
          votes: x.votes,
        };
      });
    }
    return JSON.stringify(updatedArray);
  } else {
    const newItem = {
      id: playlistId,
      tracks: tracks.map((x, index) => {
        return {
          place: index,
          trackId: x.track.id,
          votes: 0,
        };
      }),
    };
    tracks.map((x, index) => {
      trackArray[index] = x;
      trackArray[index].place = index;
      trackArray[index].votes = 0;
    });
    const { resource } = await client
      .database(databaseId)
      .container(playlistsContainer)
      .items.create(newItem);

    if (resource) {
      return JSON.stringify(trackArray);
    } else {
      throw new Error('Not able to create item');
    }
  }
}

/**
 * Delete the item by ID.
 */
async function deleteFamilyItem(itemBody) {
  await client
    .database(databaseId)
    .container(playlistsContainer)
    .item(itemBody.id, itemBody.partitionKey)
    .delete(itemBody);
}

/**
 * Cleanup the database and collection on completion
 */
async function cleanup() {
  await client.database(databaseId).delete();
}

module.exports = {
  replaceFamilyItem,
  deleteFamilyItem,
  addPlaylist,
  validateTracks,
  postVote,
  getUserVotes,
  getPlaylists,
};
