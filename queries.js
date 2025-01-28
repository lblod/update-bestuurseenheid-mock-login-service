import { updateSudo as update, querySudo as query } from '@lblod/mu-auth-sudo';
import { sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { GROUP_TYPE, PREFIXES } from './config';
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
      FILTER NOT EXISTS { ?bestuur a ${GROUP_TYPE} . }
    }
  `;
  await update(q);
}

export async function createMissingAccounts() {
  const q = `
    ${PREFIXES}
    SELECT DISTINCT ?bestuur
    WHERE {
      ?bestuur a ${GROUP_TYPE} ;
        besluit:classificatie|org:classification ?classification .

      FILTER NOT EXISTS { ?person foaf:member ?bestuur . }
    }
  `;
  const result = await query(q);

  if (result.results.bindings.length) {
    for (const bestuur of result.results.bindings.map(res => res.bestuur.value)) {

      const qGetClassifications = `
        ${PREFIXES}
        SELECT DISTINCT ?classification WHERE {
          VALUES ?bestuur {
            ${sparqlEscapeUri(bestuur)}
          }

        ?bestuur a ${GROUP_TYPE} ;
          besluit:classificatie|org:classification ?classification .
        }`;

      const rGetClassifications = await query(qGetClassifications);
      const classifications = rGetClassifications.results.bindings.map(res => res.classification.value);

      const roles = [];

      for(const classification of classifications) {
        for(const rule of rules) {
          // No restrictions, hence we can add the role.
          if(!rule.restrictToClassifications || rule.restrictToClassifications.length == 0) {
            roles.push(rule.sessionRole);
          }
          else {
            // Find matching role
            if(rule.restrictToClassifications.some(c => c == classification)) {
              roles.push(rule.sessionRole);
            }
          }
        }
      }

      if (roles.length) {
        const rolesStrings = roles.map(r => sparqlEscapeString(r)).join(',');
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
              foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service> ;
              ext:sessionRole ${rolesStrings}.
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
              foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service> ;
              ext:sessionRole ${rolesStrings}.
          }
        }
        WHERE {
          ${sparqlEscapeUri(bestuur)} a ${GROUP_TYPE} ;
            mu:uuid ?uuid ;
            skos:prefLabel ?label ;
            besluit:classificatie|org:classification ?classification .

          ?classification skos:prefLabel ?classificationLabel .

          BIND(IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?uuid)) AS ?g)

          BIND(MD5(CONCAT(?uuid,"MOCK-ACCOUNT")) as ?uuidAccount)
          BIND(IRI(CONCAT("http://data.lblod.info/id/account/", ?uuidAccount)) AS ?account)

          BIND(MD5(CONCAT(?uuid,"MOCK-PERSON")) as ?uuidPerson)
          BIND(IRI(CONCAT("http://data.lblod.info/id/persoon/", ?uuidPerson)) AS ?person)
        }`;

        await update(u);
      } else {
        console.log(`No role found for admin unit ${bestuur} of classification(s) ${classifications}`);
      }
    }
  }
}
