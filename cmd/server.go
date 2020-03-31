package cmd

import (
	"github.com/moolen/statusgraph/pkg/config"
	"github.com/moolen/statusgraph/pkg/server"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	flags := serverCommand.PersistentFlags()
	flags.String("static-dir", "/www", "path to the static dir")
	flags.String("data-dir", "/data", "path to the data dir")
	flags.String("config", "/etc/statusgraph/config.yaml", "path to the config file which contains the server configuration")
	viper.BindPFlags(flags)
	viper.BindEnv("store", "STORE")
	viper.BindEnv("static-dir", "STATIC_DIR")
	viper.BindEnv("data-dir", "DATAq_DIR")
	rootCmd.AddCommand(serverCommand)
}

var serverCommand = &cobra.Command{
	Use:   "server",
	Short: "starts the statusgraph server",
	Run: func(cmd *cobra.Command, args []string) {
		log.Infof("starting server")
		cfg, err := config.FromFile(viper.GetString("config"))
		if err != nil {
			log.Fatal(err)
		}
		// start server
		srv := server.New(cfg, viper.GetString("static-dir"), viper.GetString("data-dir"))
		log.Infof("listening on %s", srv.Addr)
		log.Fatal(srv.ListenAndServe())

	},
}
