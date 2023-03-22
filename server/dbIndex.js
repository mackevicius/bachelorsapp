//@ts-check
const CosmosClient = require('@azure/cosmos').CosmosClient;

const config = require('./dbConfig');
const url = require('url');

const endpoint = config.endpoint;

const key = config.key;

const databaseId = 'Playlists';

const containerId = 'playlists';

const partitionKey = { kind: 'Hash', paths: ['/partitionKey'] };

const options = {
  endpoint: endpoint,
  key: key,
  userAgentSuffix: 'CosmosDBJavascriptQuickstart',
};

const client = new CosmosClient(options);

/**
 * Create the database if it does not exist
 */
// export async function createDatabase() {
//   const { database } = await client.databases.createIfNotExists({
//     id: databaseId,
//   });
//   console.log(`Created database:\n${database.id}\n`);
// }

/**
 * Read the database definition
 */
// async function readDatabase() {
//   const { resource: databaseDefinition } = await client
//     .database(databaseId)
//     .read();
//   console.log(`Reading database:\n${databaseDefinition.id}\n`);
// }

/**
 * Create the container if it does not exist
 */
// async function createContainer() {
//   const { container } = await client
//     .database(databaseId)
//     .containers.createIfNotExists({ id: containerId, partitionKey });
//   console.log(`Created container:\n${config.container.id}\n`);
// }

/**
 * Read the container definition
 */
// async function readContainer() {
//   const { resource: containerDefinition } = await client
//     .database(databaseId)
//     .container(containerId)
//     .read();
//   console.log(`Reading container:\n${containerDefinition.id}\n`);
// }

/**
 * Scale a container
 * You can scale the throughput (RU/s) of your container up and down to meet the needs of the workload. Learn more: https://aka.ms/cosmos-request-units
 */
// async function scaleContainer() {
//   const { resource: containerDefinition } = await client
//     .database(databaseId)
//     .container(containerId)
//     .read();

//   try {
//     const { resources: offers } = await client.offers.readAll().fetchAll();

//     const newRups = 500;
//     for (var offer of offers) {
//       if (containerDefinition._rid !== offer.offerResourceId) {
//         continue;
//       }
//       offer.content.offerThroughput = newRups;
//       const offerToReplace = client.offer(offer.id);
//       await offerToReplace.replace(offer);
//       console.log(`Updated offer to ${newRups} RU/s\n`);
//       break;
//     }
//   } catch (err) {
//     if (err.code == 400) {
//       console.log(`Cannot read container throuthput.\n`);
//       console.log(err.body.message);
//     } else {
//       throw err;
//     }
//   }
// }

/**
 * Create family item if it does not exist
 */
async function createFamilyItem(itemBody) {
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .items.create(itemBody);
}

async function addTrack(itemBody) {
  await client
    .database(databaseId)
    .container(containerId)
    .items.create(itemBody);
}
/**
 * Query the container using SQL
 */
async function queryContainer() {
  // query to return all children in a family
  // Including the partition key value of country in the WHERE filter results in a more efficient query
  const querySpec = {
    query:
      'SELECT VALUE r.children FROM root r WHERE r.partitionKey = @country',
    parameters: [
      {
        name: '@country',
        value: 'USA',
      },
    ],
  };

  const { resources: results } = await client
    .database(databaseId)
    .container(containerId)
    .items.query('SELECT * from c')
    .fetchAll();

  return JSON.stringify(results);
  // for (var queryResult of results) {
  //   let resultString = JSON.stringify(queryResult);
  //   console.log(`\tQuery returned ${resultString}\n`);
  // }
}

/**
 * Replace the item by ID.
 */
async function replaceFamilyItem(itemBody) {
  console.log(`Replacing item:\n${itemBody.id}\n`);
  console.log(itemBody.partitionKey);
  // Change property 'grade'
  itemBody.children = 'duh';
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .item(itemBody.id, itemBody.partitionKey)
    .replace(itemBody);
}
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function uploadInfo(containerId, itemBody) {
  // console.log(itemBody.partitionKey);
  // Change property 'grade'

  const tracks = itemBody.tracks.map((x) => {
    return {
      trackId: x,
      votes: randomInteger(1, 100),
    };
  });

  const newBody = {
    id: itemBody.id,
    tracks,
  };
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .item(newBody.id)
    .replace(newBody);
}

async function validateTracks(tracks, playlistId) {
  const { resources: results } = await client
    .database(databaseId)
    .container(containerId)
    .items.query(`SELECT * from c where c.id="${playlistId}"`)
    .fetchAll();
  const trackArray = [];

  if (results[0]) {
    const dbTracks = results[0].tracks;
    let newTracks = 0;
    tracks.forEach((spotifyTrack, index) => {
      let votes = 0;
      const match = dbTracks.find((databaseTrack) => {
        return databaseTrack.trackId === spotifyTrack.track.id;
      });
      if (!match) {
        addTrack({
          id: spotifyTrack.id,
          votes: votes,
        })
          .then(() => {
            newTracks++;
          })
          .catch((err) => console.log(err));
      } else {
        votes = match.votes;
        trackArray[index] = spotifyTrack;
        trackArray[index].votes = votes;
      }
    });
    if (newTracks !== 0) {
      throw new Error('tracksMismatch');
    } else {
      return JSON.stringify(trackArray);
    }
  } else {
    const newItem = {
      id: playlistId,
      tracks: tracks.map((x) => {
        return {
          trackId: x.track.id,
          votes: 0,
        };
      }),
    };
    tracks.map((x, index) => {
      trackArray[index] = x;
      trackArray[index].votes = 0;
    });
    const { resource } = await client
      .database(databaseId)
      .container(containerId)
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
    .container(containerId)
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
  queryContainer,
  createFamilyItem,
  replaceFamilyItem,
  deleteFamilyItem,
  uploadInfo,
  validateTracks,
};
