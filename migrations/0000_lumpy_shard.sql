CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"show_id" integer,
	"seat_numbers" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"poster" text,
	"description" text,
	"theme_color" varchar(7) DEFAULT '#4B5320',
	"emoji" varchar(50),
	"blocked_seats" json DEFAULT '[]'::json NOT NULL,
	"price" integer DEFAULT 0,
	"seat_layout" json DEFAULT '[{"section":"Balcony","rows":[{"row":"C","seats":[1,2,3,4,5,6,7,8,9,10,11,12],"total_seats":12},{"row":"B","seats":[1,2,3,4,5,6,7,8,9,10,11,12],"total_seats":12},{"row":"A","seats":[9,10,11,12],"total_seats":4}],"total_section_seats":28},{"section":"Downstairs","rows":[{"row":"N","seats":[1,2,3,4,9,10,11,12,13,14,15,16],"total_seats":12},{"row":"M","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"total_seats":16},{"row":"L","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"total_seats":16},{"row":"K","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"total_seats":16},{"row":"J","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"total_seats":16},{"row":"I","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"total_seats":16},{"row":"H","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"total_seats":16},{"row":"G","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],"total_seats":16},{"row":"F","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],"total_seats":18},{"row":"E","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],"total_seats":18},{"row":"D","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],"total_seats":18},{"row":"C","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],"total_seats":18},{"row":"B","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],"total_seats":18},{"row":"A","seats":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],"total_seats":18}],"total_section_seats":232}]'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"seat_limit" integer DEFAULT 4 NOT NULL,
	"name" varchar(255),
	"gender" varchar(50),
	"date_of_birth" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;