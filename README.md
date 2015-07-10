# ESIEE API
An exhaustive API for ESIEE's calendar

# Reference

The base URI for the API is ```/api2/<request>```

## Querying upcoming activities

An activity is composed of:
- The name of the activity (mainly the subject name).
- A description containing most of the time the groups concerned, the name of the subject, the name of the teacher and the export date.
- The starting time of the avtivity.
- The ending time of the activity.
- The rooms where the avtivity take place.

This result in the following JSON template:
```json
{
	"name"       : "String",
	"description": "String",
	"start"      : "Date",
	"end"        : "Date",
	"rooms"      : [
		"String"
	]
}
```

| URI                      | Description                                                |
|--------------------------|------------------------------------------------------------|
| /api2/activities          | Query all upcoming activities.                             |
| /api2/activities/*n*      | Query *n* upcoming activities.                             |
| /api2/activities/*n*/*s*  | Query *n* upcoming activities and skip the *s* first ones. |

## Querying upcoming tests

A test is an activity and therefore has the same template.

| URI                    | Description                                                                                                           |
|------------------------|-----------------------------------------------------------------------------------------------------------------------|
| /api2/tests             | Query all upcoming tests.                                                                                             |
| /api2/tests/*promotion* | Query all upcoming tests for this *promotion*. (Currently support only tests with a name of type ```AAA-0000:CTRL```) |

## Querying free rooms

A room is only a String, which means that the result will be like:
```json
[
	"Room1",
	"Room2",
	"Room3",
	"…"
]
```

| URI               | Description                              |
|-------------------|------------------------------------------|
| /api2/rooms        | Query all rooms that are currently free. |
| /api2/rooms/*time* | Query all rooms that are free at *time*. |
