// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import compose from 'recompose/compose';
import type { Dispatch } from 'redux';
import { ErrorBoundary } from 'src/components/error';
import Icon from 'src/components/icon';
import { Loading } from 'src/components/loading';
import viewNetworkHandler from 'src/components/viewNetworkHandler';
import getCommunityChannels from 'shared/graphql/queries/community/getCommunityChannelConnection';
import type { GetCommunityChannelConnectionType } from 'shared/graphql/queries/community/getCommunityChannelConnection';
import { withCurrentUser } from 'src/components/withCurrentUser';
import Tooltip from 'src/components/tooltip';
import { ChannelListItem } from 'src/components/entities';
import { WhiteIconButton } from 'src/components/button';
import { SidebarSectionHeader, SidebarSectionHeading, List } from '../style';

type Props = {
  data: {
    community: GetCommunityChannelConnectionType,
  },
  isLoading: boolean,
  dispatch: Dispatch<Object>,
  currentUser: Object,
  communitySlug: string,
};

class Component extends React.Component<Props> {
  sortChannelsBySlug = (array: Array<any>): Array<?any> => {
    if (!array || array.length === 0) return [];

    const generalChannel = array.find(channel => channel.slug === 'general');
    const withoutGeneral = array.filter(channel => channel.slug !== 'general');
    const sortedWithoutGeneral = withoutGeneral.sort((a, b) => {
      if (a.slug < b.slug) return -1;
      if (a.slug > b.slug) return 1;
      return 0;
    });
    if (generalChannel) {
      sortedWithoutGeneral.unshift(generalChannel);
      return sortedWithoutGeneral;
    } else {
      return sortedWithoutGeneral;
    }
  };

  sortChannelsByOrderRank = (array: Array<any>): Array<?any> => {
    if (!array || array.length === 0) return [];

    return array.sort((a, b) => {
      // channels with no orderRank will be moved to last
      if (a.orderRank === null || a.orderRank === undefined) return 1;
      if (b.orderRank === null || b.orderRank === undefined) return -1;

      if (a.orderRank < b.orderRank) return -1;
      if (a.orderRank > b.orderRank) return 1;

      return 0;
    });
  };

  sortChannels = (channels: Array<any>): Array<?any> => {
    if (!channels || channels.length === 0) return [];

    const areChannelsHaveOrderRank = channels.some(
      ({ orderRank }) => typeof orderRank === 'number'
    );

    return areChannelsHaveOrderRank
      ? this.sortChannelsByOrderRank(channels)
      : this.sortChannelsBySlug(channels);
  };

  render() {
    const {
      isLoading,
      data: { community },
    } = this.props;

    if (isLoading) {
      return (
        <React.Fragment>
          <SidebarSectionHeader>
            <SidebarSectionHeading>Channels</SidebarSectionHeading>
          </SidebarSectionHeader>
          <Loading style={{ padding: '32px' }} />
        </React.Fragment>
      );
    }

    if (community && community.channelConnection) {
      const { isOwner } = community.communityPermissions;
      const channels = community.channelConnection.edges
        .map(channel => channel && channel.node)
        .filter(channel => {
          if (!channel) return null;
          if (channel.isArchived) return null;
          if (channel.isPrivate && !channel.channelPermissions.isMember)
            return null;

          return channel;
        })
        .filter(channel => channel && !channel.channelPermissions.isBlocked);

      const sortedChannels = this.sortChannels(channels);

      return (
        <React.Fragment>
          <SidebarSectionHeader>
            <SidebarSectionHeading>Channels</SidebarSectionHeading>
            {isOwner && (
              <Tooltip content={'Manage channels'}>
                <span>
                  <WhiteIconButton to={`/${community.slug}/settings`}>
                    <Icon glyph={'settings'} size={24} />
                  </WhiteIconButton>
                </span>
              </Tooltip>
            )}
          </SidebarSectionHeader>

          <List data-cy="channel-list">
            {sortedChannels.map(channel => {
              if (!channel) return null;
              return (
                <ErrorBoundary key={channel.id}>
                  <ChannelListItem channel={channel} name={channel.name} />
                </ErrorBoundary>
              );
            })}
          </List>
        </React.Fragment>
      );
    }

    return null;
  }
}

export const ChannelsList = compose(
  getCommunityChannels,
  viewNetworkHandler,
  withCurrentUser,
  connect()
)(Component);
