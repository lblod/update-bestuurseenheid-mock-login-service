export const CRON_PATTERN = process.env.CRON_PATTERN || '0 0 * * * *'; // every hour

export const PREFIXES = `
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
  PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
  PREFIX org: <http://www.w3.org/ns/org#>
`;
