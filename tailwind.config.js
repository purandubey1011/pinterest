/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/*.{html,ejs}"],
  theme: {
    extend: {},
  },
  plugins: [],
}

// npx tailwindcss -i ./public/stylesheets/input.css -o ./public/stylesheets/style.css --watch