/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
				// deepgram COSMOS styleguide colors
				fireEngine: "rgba(251, 54, 64, 1)",
				dgRed: "rgba(233, 61, 69, 1)",
				cottonCandy: "rgba(255,235,235,1)",
				coral: "rgba(254, 92, 92, 1)",
				crimson: "rgba(171, 26, 34, 1)",
				blood: "rgba(102, 0, 0, 1)",

				meadow: "rgba(56, 237, 172, 1)",
				mint: "rgba(218, 255, 242, 1)",
				grass: "rgba(0, 169, 113, 1)",
				watercourse: "rgba(0, 135, 82, 1)",
				evergreen: "rgba(2, 84, 69, 1)",

				powder: "rgba(232,241,255,1)",
				sky: "rgba(105, 165, 255, 1)",
				cornflower: "rgba(85, 148, 255, 1)",
				ocean: "rgba(0, 114, 255, 1)",
				blueberry: "rgba(28, 67, 116, 1)",

				lightIris: "rgba(150,162,255,1)",
				iris: "rgba(93,111,208,1)",
				darkIris: "rgba(52, 27, 203, 1)",

				sunflower: "rgba(255, 211, 75, 1)",
				gold: "rgba(251, 172, 24, 1)",

				//white
				mist: "rgba(247, 249, 252, 1)",
				cloud: "rgba(215, 223, 235, 1)",
				cloud30: "rgba(215, 223, 235, .3)",
				casper: "rgba(170, 184, 205, 1)",
				stone: "rgba(117, 138, 162, 1)",
				storm: "rgba(102, 120, 141, 1)",
				steel: "rgba(79, 98, 120, 1)",
				rock: "rgba(53, 70, 89, 1)",
				ink: "rgba(30, 44, 60, 1)",
				darkCharcoal: "rgba(20, 30, 41, 1)",
				almostBlack: "rgba(10, 18, 27, 1)",
				offBlack: "rgba(5, 10, 15, 1)",
				//black

				highlight: "rgba(253,255,0, 1)",

				http: {
					get: "#2B2BFA",
					options: "#2B2BFA",
					patch: "#2B2BFA",
					post: "#00A971",
					put: "#A56FFF",
					delete: "#FB3640",
				},
				language: {
					nodejs: {
						green: "#3C873A",
						grey: "#303030",
					},
					python: {
						yellow: "#FFE873",
						blue: "#306998",
					},
				},
				brand: {
					twilio: "#306998",
					zoom: "#2D8CFF",
					facebook: "#4267B2",
					hackernews: "#f75500",
					linkedin: "#0072b1",
					pocket: "#f83153",
					reddit: "#ff4301",
					slack: "#4a154b",
					twitch: "#9146ff",
					twitter: "#1da1f2",
					vk: "#4a76a8",
					weibo: "#e6162d",
					stackoverflow: "#ff9900",
					github: "#24292e",
					youtube: "#ff0000",
				},
			},

			/**
			 * Gadients
			 * ========
			 */
			backgroundImage: (theme) => ({
				/**
				 * coral/irisLight/meadow
				 * ----------------------
				 * left to right - class="bg-gradient-to-r from-coral via-lightIris to-meadow"
				 * top to bottom - class="bg-gradient-to-b from-coral via-lightIris to-meadow"
				 */
				"gradient--light-vertical": `linear-gradient(to right, ${theme("colors.coral")}, ${theme("colors.lightIris")}, ${theme("colors.meadow")})`,
				"gradient--light-horizontal": `linear-gradient(to bottom, ${theme("colors.coral")}, ${theme("colors.lightIris")}, ${theme("colors.meadow")})`,

				/**
				 * fireEngine/iris/meadow
				 * ----------------------
				 * left to right - class="bg-gradient-to-r from-fireEngine via-iris to-meadow"
				 * top to bottom - class="bg-gradient-to-b from-fireEngine via-iris to-meadow"
				 */
				"gradient--vibrant-horizontal": `linear-gradient(to bottom, ${theme("colors.fireEngine")}, ${theme("colors.iris")}, ${theme("colors.meadow")})`,
				"gradient--vibrant-vertical": `linear-gradient(to right, ${theme("colors.fireEngine")}, ${theme("colors.iris")}, ${theme("colors.meadow")})`,

				/**
				 * iris/coral
				 * ----------
				 * top to bottom - class="bg-gradient-to-b from-iris to-coral"
				 */
				"gradient--iris-to-coral": `linear-gradient(to bottom, ${theme("colors.iris")}, ${theme("colors.coral")})`,

				/**
				 * mint/powder/cottonCandy
				 * -----------------------
				 * left to right - class="bg-gradient-to-r from-mint via-powder to-cottonCandy"
				 */
				"gradient--pale-left-to-right": `linear-gradient(to bottom, ${theme("colors.mint")}, ${theme("colors.powder")}, ${theme("colors.cottonCandy")})`,

				/**
				 * meadow/lightIris
				 * ----------------
				 * top-left to bottom-right - class="bg-gradient-to-br from-meadow to-lightIris"
				 */
				"gradient--meadow-to-lightIris": `linear-gradient(to bottom right, ${theme("colors.meadow")}, ${theme("colors.lightIris")})`,

				/**
				 * meadow/iris
				 * ----------------
				 * top to bottom - class="bg-gradient-to-b from-meadow to-iris"
				 */
				"gradient--meadow-to-iris": `linear-gradient(to bottom, ${theme("colors.meadow")}, ${theme("colors.iris")})`,

				/**
				 * storm/iris
				 * ----------------
				 * top to bottom - class="bg-gradient-to-b from-storm to-lightIris"
				 */
				"gradient--storm-to-lightIris": `linear-gradient(to bottom, ${theme("colors.storm")}, ${theme("colors.lightIris")})`,
			}),
    },
  },
  plugins: [
  ]
}
