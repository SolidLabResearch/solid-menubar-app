const N3 = require('n3');
const {QueryEngine} = require("@comunica/query-sparql-rdfjs");

function turtleToN3Store(turtle) {
  return new Promise((resolve, reject) => {
    const parser = new N3.Parser();
    const store = new N3.Store();
    parser.parse(turtle,
      (error, quad, prefixes) => {
        if (quad)
          store.add(quad);
        else {
          resolve(store);
        }
      });
  });
}

async function getDates(vacationUrl, fetch) {
  const response = await fetch(vacationUrl, {headers: {'accept': 'text/turtle'}});
  const store = await turtleToN3Store(await response.text());

  const myEngine = new QueryEngine();
  const bindingsStream = await myEngine.queryBindings(`
      SELECT ?date WHERE {
        ?s <https://data.knows.idlab.ugent.be/person/office/#date> ?date.
      } LIMIT 100`, {
    sources: [store],
  });

  const bindings = await bindingsStream.toArray();
  return bindings.map(b => b.get('date').value);
}

async function getAllDates(data, fetch) {
  const result = [];

  for (const el of data) {
    result.push({
      name: el.webid,
      dates: await getDates(el.vacationUrl, fetch)
    });
  }

  return result;
}

function getVacationsToday(data) {
  const today = (new Date()).toISOString().substring(0, 10);
  const result = [];

  for (const el of data) {
    if (el.dates.includes(today)) {
      result.push(el.name);
    }
  }

  return result;
}

function removeToday(data) {
  console.log(data);
  const today = (new Date()).toISOString().substring(0, 10);

  for (const el of data) {
    if (el.dates.includes(today)) {
      el.dates.splice(el.dates.indexOf(today), 1);
    }
  }
}

module.exports = {getDates, getAllDates, removeToday, getVacationsToday}