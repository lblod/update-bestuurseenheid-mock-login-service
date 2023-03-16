import { updateSudo as update, querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { PREFIXES } from './config';
import { rules } from '/config/rules';

export async function deleteDanglingAccounts() {
  const q = `
    ${PREFIXES}
    DELETE {
      GRAPH ?g {
        ?person ?pperson ?operson .
        ?account ?paccount ?oaccount .
      }
    }
    WHERE {
      GRAPH ?g {
        ?person foaf:member ?bestuur ;
          foaf:account ?account ;
          ?pperson ?operson .

        ?account ?paccount ?oaccount .
      }
      FILTER NOT EXISTS { ?bestuur a besluit:Bestuurseenheid . }
    }
  `;
  await update(q);
}

export async function createMissingAccounts() {
  const q = `
    ${PREFIXES}
    SELECT DISTINCT ?bestuur
    WHERE {
      ?bestuur a besluit:Bestuurseenheid .

      FILTER NOT EXISTS { ?person foaf:member ?bestuur . }
    }
  `;
  const result = await query(q);

  if (result.results.bindings.length) {
    for (const bestuur of result.results.bindings.map(res => res.bestuur.value)) {
      for (const rule of rules) {
        let valuesFilter = '';
        if (rule.restrictToClassifications && rule.restrictToClassifications.length) {
          valuesFilter = `
            VALUES ?classification {
              <${rule.restrictToClassifications.join('> <')}>
            }
          `;
        }

        const u = `
        ${PREFIXES}
        INSERT {
          GRAPH <http://mu.semte.ch/graphs/public> {
            ?person a foaf:Person ;
              mu:uuid ?uuidPerson ;
              foaf:account ?account ;
              foaf:familyName ?label ;
              foaf:firstName ?classificationLabel ;
              foaf:member ${sparqlEscapeUri(bestuur)} .

            ?account a foaf:OnlineAccount ;
              mu:uuid ?uuidAccount ;
              ext:sessionRole ${sparqlEscapeString(rule.sessionRole)} ;
              foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service> .
          }
          GRAPH ?g {
            ?person a foaf:Person ;
              mu:uuid ?uuidPerson ;
              foaf:account ?account ;
              foaf:familyName ?label ;
              foaf:firstName ?classificationLabel ;
              foaf:member ${sparqlEscapeUri(bestuur)} .

            ?account a foaf:OnlineAccount ;
              mu:uuid ?uuidAccount ;
              ext:sessionRole ${sparqlEscapeString(rule.sessionRole)} ;
              foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service> .
          }
        }
        WHERE {
          ${sparqlEscapeUri(bestuur)} a besluit:Bestuurseenheid ;
            mu:uuid ?uuid ;
            skos:prefLabel ?label ;
            besluit:classificatie|org:classification ?classification .

          ${valuesFilter}

          ?classification skos:prefLabel ?classificationLabel .

          BIND(IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?uuid)) AS ?g)

          BIND(MD5(CONCAT(?bestuur,"MOCK-ACCOUNT")) as ?uuidAccount)
          BIND(IRI(CONCAT("http://data.lblod.info/id/account/", ?uuidAccount)) AS ?account)

          BIND(MD5(CONCAT(?bestuur,"MOCK-PERSON")) as ?uuidPerson)
          BIND(IRI(CONCAT("http://data.lblod.info/id/persoon/", ?uuidPerson)) AS ?person)
        }
        `;
        await update(u);
      }
    }
  }
}
