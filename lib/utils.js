const {QueryEngine} = require("@comunica/query-sparql");

async function getDates(vacationUrl, fetch) {
  const myEngine = new QueryEngine();
  const bindingsStream = await myEngine.queryBindings(`
      SELECT ?date WHERE {
        ?s <https://data.knows.idlab.ugent.be/person/office/#date> ?date.
      }`, {
    sources: [vacationUrl],
    fetch
  });

  const bindings = await bindingsStream.toArray();
  return bindings.map(b => b.get('date').value);
}

async function getAllDates(data, fetch) {
  const result = [];

  for (const el of data) {
    const names = await getName(el.webid, fetch);
    let name = el.webid;

    if (names.length > 0) {
      name = names[0];
    }

    result.push({
      name,
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
  const today = (new Date()).toISOString().substring(0, 10);

  for (const el of data) {
    if (el.dates.includes(today)) {
      el.dates.splice(el.dates.indexOf(today), 1);
    }
  }
}

async function getName(webid, fetch) {
  const myEngine = new QueryEngine();
  const bindingsStream = await myEngine.queryBindings(`
      PREFIX schema: <http://schema.org/> 
      SELECT ?name WHERE {
        <${webid}> schema:name ?name
      } LIMIT 1`, {
    sources: [webid, 'https://data.knows.idlab.ugent.be/person/office/employees-extra'],
    fetch
  });

  const bindings = await bindingsStream.toArray();
  return bindings.map(b => b.get('name').value);
}

module.exports = {getDates, getAllDates, removeToday, getVacationsToday}