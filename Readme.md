Tours API

Build using : Node.js, Express.js, MongoDB, NPM

Resources : Tours --> Only Admin can create a tour. All the guides information
for a particular tour are feded in tour resources itself.
Also only have admin access to modify or delete the tour.
Some special routes of getting top 5 cheap tours, tours month wise plan, tours statistics are also implemented

            Users -->   There are four types of Users [user, admin, guide, lead-guide]

                        All the Users resources JWT authenrication is implemented so that to access any of the protected end point must have to add Authentication --> Bearer Token to test the API.
                        Forget password and Reset password functionality also implemented.


            Reviews --> Only an Authenticated user(not admin, guide, lead-guide) can add
                        a review. review can updated or deleted by admin or user only.
                        guide and lead-guide have only read access to review.
                        One user can only add one review in a particular tour

Note-1 : For every resource API features of filter, sort, pagination, fields are
implemented for that just have to attach some query string in below specified format to the request url

       Ex: api/v1/tours?duration[gte]=5
           api/v1/tours?duration[gte]=5&sort=price
           api/v1/tours?fields=name,ratingsAverage,price,summary&sort=price
           api/v1/tours?page=2&sort=price

Note-2 : Providing some documents of user to test the api

        user : email:ayls@example.com
               password:test1234

        guide: email:jennifer@example.com
               password:test1234

        admin: email:admin@natours.io
               password:test1234

All implemented end points:

     Tours : 1. Get All Tours
             2. Create new tour
             3. Get one single Tour
             4. Update tour
             5. Delete Tour
             6.Top-5 Cheap tours
             7.Tour Statistics
             8.Tours month wise plan for a year
             9. Get all the tours information with in certain radius passing the current
                position in latitude longitude form and the distance

             10. Get Distance of all the tour from certain point

    Users : 1. Get All users(only admin access)
            2. Get One user(only admin access)
            3. Update user(only admin access)
            4. Delete user(only admin access)
            5. Get current user(only authenticated user)
            6. Update current user (only authenticated user)
            7. Delete current user (only authenticated user) --> Not actually deleted
               but inactive

    Authentication: 1. Signup
                    2. Login
                    3. Forget password
                    4.Reset password(only signed in user)
                    5.update password

    Reviews: 1. Get All review
             2. Create new review(only user)
             3. Get one Review
             4. Update review(only user and admin)
             5. Delete review(only user a nd adin)


    Tours/review: 1. Create new reviews on a particular tour
                  2. Get All reviews list on a particular tour
