# update-bestuurseenheid-mock-login-service

This service adds or removes mock-login accounts depending on the available administrative units. It runs on a configurable basis via a cron job.

## Installation

Add the following snippet to your `docker-compose.yml`:

```
update-bestuurseenheid-mock-login-service:
  image: lblod/update-bestuurseenheid-mock-login-service
  volumes:
    - ./config/mock-login:/config
```

## Configuration

To configure which roles should be attributed to the administrative units of which type, a configuration file is required. The rules are an array of objects, with two properties :
- [required] `sessionRole`: a role to add to mock login accounts
- [optional] `restrictToClassifications`: an array of classifications. If defined, the role will only be applied to administrative units of this classification. If not defined, the role will be applied to all the administrative units, regardless of their classification.

```rules.json

{
  "rules": [
    {
      "sessionRole": "role-A",
      "restrictToClassifications": [
        "http://data.vlaanderen.be/id/concept/BestuurseenheidClassificatieCode/example-one",
        "http://data.vlaanderen.be/id/concept/BestuurseenheidClassificatieCode/example-two"
      ]
    },
    {
      "sessionRole": "role-B",
      "restrictToClassifications": [
        "http://data.vlaanderen.be/id/concept/BestuurseenheidClassificatieCode/example-two",
        "http://data.vlaanderen.be/id/concept/BestuurseenheidClassificatieCode/example-three"
      ]
    }
  ]
}

```

## Environment variables

- `CRON_PATTERN`: The cron pattern definning when the healing happens. Defaults to `0 0 * * * *` (every hour)
