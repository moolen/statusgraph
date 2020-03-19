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
	flags.String("store", "/data", "path in which the credentials will be stored")
	flags.String("config", "config.yaml", "path to the config file which contains the server configuration")
	viper.BindPFlags(flags)
	viper.BindEnv("store", "STORE")
	viper.BindEnv("config", "CONFIG")
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
		srv := server.New(cfg)
		log.Infof("listening on %s", srv.Addr)
		log.Fatal(srv.ListenAndServe())

	},
}
